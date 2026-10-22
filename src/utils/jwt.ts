import { SignJWT, jwtVerify } from 'jose';
import { ROLES, type Role, type SessionPayload } from '@/types';

/**
 * Núcleo JWT sin dependencias de Next/BD: lo usan tanto proxy.ts como el DAL.
 */
export const SESSION_COOKIE = 'feltrin_session';
const ISSUER = 'feltrin-gym';
const ALG = 'HS256';

function getKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET no definida o con menos de 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

export function sessionTtlSeconds(): number {
  const hours = Number(process.env.SESSION_TTL_HOURS ?? '12');
  return Math.max(1, Number.isFinite(hours) ? hours : 12) * 3600;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, ver: payload.ver })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${sessionTtlSeconds()}s`)
    .sign(getKey());
}

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { issuer: ISSUER, algorithms: [ALG] });
    const { sub, role, name, ver } = payload;
    if (typeof sub !== 'string' || !isRole(role) || typeof name !== 'string' || typeof ver !== 'number') {
      return null;
    }
    return { sub, role, name, ver };
  } catch {
    return null;
  }
}
