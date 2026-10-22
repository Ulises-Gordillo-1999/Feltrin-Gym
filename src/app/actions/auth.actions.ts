'use server';

import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createSessionCookie, destroySessionCookie, verifyPassword } from '@/utils/session';
import type { ActionState } from '@/types';

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/dashboard');

  if (!email || !password) {
    return {
      status: 'error',
      message: 'Completá todos los campos requeridos.',
      fieldErrors: {
        email: !email ? 'El email es obligatorio' : undefined,
        password: !password ? 'La contraseña es obligatoria' : undefined,
      },
    };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, email),
    });

    if (!user || !user.isActive) {
      return {
        status: 'error',
        message: 'Credenciales inválidas o cuenta inactiva.',
      };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return {
        status: 'error',
        message: 'Credenciales inválidas o cuenta inactiva.',
      };
    }

    // Actualizar último inicio de sesión
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generar cookie JWT HttpOnly
    await createSessionCookie({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      tokenVersion: user.tokenVersion,
    });
  } catch (error) {
    console.error('Error en loginAction:', error);
    return {
      status: 'error',
      message: 'Ocurrió un error inesperado al iniciar sesión.',
    };
  }

  // Redirigir fuera del bloque try/catch para permitir que Next lance NEXT_REDIRECT
  redirect(next.startsWith('/') ? next : '/dashboard');
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect('/login');
}
