'use server';

import { cookies, headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { db } from '@/db';
import { users, userPasskeys, userPushSubscriptions } from '@/db/schema';
import { getSession, requireSession, createSessionCookie } from '@/utils/session';
import type { ActionResult } from '@/types';

const CHALLENGE_COOKIE = 'feltrin_webauthn_challenge';

let tablesEnsured = false;

export async function ensureWebAuthnTables(): Promise<void> {
  if (tablesEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_passkeys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "credential_id" text NOT NULL,
        "public_key" text NOT NULL,
        "counter" bigint DEFAULT 0 NOT NULL,
        "device_type" varchar(32) DEFAULT 'singleDevice',
        "backed_up" boolean DEFAULT false NOT NULL,
        "transports" text,
        "friendly_name" varchar(100),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "last_used_at" timestamp with time zone
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "user_passkeys_credential_id_unique" ON "user_passkeys" ("credential_id");
      CREATE INDEX IF NOT EXISTS "user_passkeys_user_idx" ON "user_passkeys" ("user_id");

      CREATE TABLE IF NOT EXISTS "user_push_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "user_push_endpoint_unique" ON "user_push_subscriptions" ("endpoint");
      CREATE INDEX IF NOT EXISTS "user_push_user_idx" ON "user_push_subscriptions" ("user_id");
    `);
    tablesEnsured = true;
  } catch (err) {
    console.error('Error ensuring webauthn tables:', err);
  }
}

async function getWebAuthnConfig() {
  const reqHeaders = await headers();
  const host = reqHeaders.get('host') || 'localhost:3001';
  let rpID = host.split(':')[0] || 'localhost';
  if (rpID.endsWith('feltringym.com')) {
    rpID = 'feltringym.com';
  }

  const proto = reqHeaders.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const currentOrigin = `${proto}://${host}`;
  const expectedOrigin = [
    currentOrigin,
    'https://feltringym.com',
    'https://www.feltringym.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  return {
    rpID,
    rpName: 'Centro de Entrenamiento Feltrin',
    expectedOrigin,
  };
}

/**
 * 1. Genera opciones de registro de huella/Face ID (WebAuthn) para el usuario autenticado.
 */
export async function getRegistrationOptionsAction(): Promise<ActionResult<any>> {
  await ensureWebAuthnTables();
  const session = await requireSession();
  const { rpID, rpName } = await getWebAuthnConfig();

  // Obtener credenciales ya registradas del usuario para excluirlas
  const existingPasskeys = await db.query.userPasskeys.findMany({
    where: eq(userPasskeys.userId, session.id),
    columns: { credentialId: true, transports: true },
  });

  const excludeCredentials = existingPasskeys.map((p) => ({
    id: p.credentialId,
    transports: p.transports ? (JSON.parse(p.transports) as any) : undefined,
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(session.id),
    userName: session.email,
    userDisplayName: session.fullName,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Obliga al sensor de huella / Face ID del dispositivo
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return { ok: true, data: options };
}

/**
 * 2. Verifica y almacena la credencial biométrica en la base de datos.
 */
export async function verifyRegistrationAction(
  response: RegistrationResponseJSON,
  friendlyName?: string,
): Promise<ActionResult<{ credentialId: string }>> {
  const session = await requireSession();
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(CHALLENGE_COOKIE)?.value;

  if (!expectedChallenge) {
    return { ok: false, error: 'Desafío biométrico expirado o no encontrado. Intentá nuevamente.' };
  }

  const { rpID, expectedOrigin } = await getWebAuthnConfig();

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: 'No se pudo verificar la huella dactilar.' };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Guardar en la base de datos
    await db.insert(userPasskeys).values({
      userId: session.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
      friendlyName: friendlyName?.trim() || 'Dispositivo Móvil',
    });

    cookieStore.delete(CHALLENGE_COOKIE);
    return { ok: true, data: { credentialId: credential.id } };
  } catch (error: unknown) {
    console.error('Error verifyRegistrationAction:', error);
    const msg = error instanceof Error ? error.message : 'Error al registrar huella dactilar';
    return { ok: false, error: msg };
  }
}

/**
 * 3. Genera opciones de autenticación para iniciar sesión con huella (Passwordless).
 */
export async function getAuthenticationOptionsAction(): Promise<ActionResult<any>> {
  await ensureWebAuthnTables();
  const { rpID } = await getWebAuthnConfig();

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: [], // Discoverable credentials (Resident Key)
  });

  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return { ok: true, data: options };
}

/**
 * 4. Valida la huella dactilar, identifica al usuario e inicia su sesión JWT.
 */
export async function verifyAuthenticationAction(
  response: AuthenticationResponseJSON,
): Promise<ActionResult<{ role: string; redirectUrl: string }>> {
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(CHALLENGE_COOKIE)?.value;

  if (!expectedChallenge) {
    return { ok: false, error: 'Desafío expirado. Por favor, reintentá el acceso con huella.' };
  }

  // Buscar la credencial registrada
  const passkey = await db.query.userPasskeys.findFirst({
    where: eq(userPasskeys.credentialId, response.id),
    with: { user: true },
  });

  if (!passkey || !passkey.user || !passkey.user.isActive) {
    return { ok: false, error: 'Huella o dispositivo no registrado o usuario inactivo.' };
  }

  const { rpID, expectedOrigin } = await getWebAuthnConfig();

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports ? (JSON.parse(passkey.transports) as any) : undefined,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return { ok: false, error: 'No se pudo verificar la huella dactilar.' };
    }

    // Actualizar counter antirrepetición y fecha de último uso
    await db
      .update(userPasskeys)
      .set({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(userPasskeys.id, passkey.id));

    // Actualizar último login del usuario
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, passkey.user.id));

    // Crear cookie de sesión JWT HttpOnly
    await createSessionCookie({
      id: passkey.user.id,
      role: passkey.user.role,
      fullName: passkey.user.fullName,
      tokenVersion: passkey.user.tokenVersion,
    });

    cookieStore.delete(CHALLENGE_COOKIE);

    let redirectUrl = '/dashboard';
    if (passkey.user.role === 'ALUMNO') {
      redirectUrl = '/mi-rutina';
    } else if (passkey.user.role === 'PROFESOR') {
      redirectUrl = '/alumnos';
    }

    return {
      ok: true,
      data: {
        role: passkey.user.role,
        redirectUrl,
      },
    };
  } catch (error: unknown) {
    console.error('Error verifyAuthenticationAction:', error);
    const msg = error instanceof Error ? error.message : 'Error al verificar autenticación biométrica';
    return { ok: false, error: msg };
  }
}

/**
 * 5. Guarda o actualiza suscripción a notificaciones push del usuario.
 */
export async function savePushSubscriptionAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<ActionResult> {
  await ensureWebAuthnTables();
  const session = await getSession();
  if (!session) return { ok: false, error: 'No autorizado' };

  try {
    const existing = await db.query.userPushSubscriptions.findFirst({
      where: eq(userPushSubscriptions.endpoint, subscription.endpoint),
    });

    if (existing) {
      await db
        .update(userPushSubscriptions)
        .set({
          userId: session.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        })
        .where(eq(userPushSubscriptions.id, existing.id));
    } else {
      await db.insert(userPushSubscriptions).values({
        userId: session.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }

    return { ok: true, data: undefined };
  } catch (error: unknown) {
    console.error('Error savePushSubscriptionAction:', error);
    return { ok: false, error: 'No se pudo guardar la suscripción push.' };
  }
}

/**
 * 6. Verifica si el usuario actual ya tiene alguna huella registrada.
 */
export async function getUserPasskeysCountAction(): Promise<number> {
  await ensureWebAuthnTables();
  const session = await getSession();
  if (!session) return 0;

  const passkeys = await db.query.userPasskeys.findMany({
    where: eq(userPasskeys.userId, session.id),
    columns: { id: true },
  });

  return passkeys.length;
}

