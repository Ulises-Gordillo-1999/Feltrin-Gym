'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, type UserRole } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { hashPassword } from '@/utils/session';
import type { ActionResult, ActionState } from '@/types';

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('ADMIN');

  const fullName = String(formData.get('fullName') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const role = (String(formData.get('role') || 'PROFESOR')) as UserRole;

  if (!fullName || !email || !password || password.length < 6) {
    return {
      status: 'error',
      message: 'Completá todos los campos. La contraseña debe tener al menos 6 caracteres.',
    };
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, email),
    });

    if (existing) {
      return { status: 'error', message: 'Ya existe un usuario con este correo electrónico.' };
    }

    const pHash = await hashPassword(password);
    await db.insert(users).values({
      fullName,
      email,
      passwordHash: pHash,
      role,
      isActive: true,
      tokenVersion: 1,
    });

    revalidatePath('/usuarios');
    return { status: 'success', message: 'Usuario creado exitosamente.' };
  } catch (error) {
    console.error('Error createUserAction:', error);
    return { status: 'error', message: 'No se pudo crear el usuario.' };
  }
}

export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole,
): Promise<ActionResult> {
  const session = await requireRole('ADMIN');

  if (userId === session.id) {
    return { ok: false, error: 'No podés cambiar tu propio rol de administrador.' };
  }

  try {
    // Incrementar tokenVersion para forzar re-login con los nuevos privilegios
    await db
      .update(users)
      .set({
        role: newRole,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, userId));

    revalidatePath('/usuarios');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error updateUserRoleAction:', error);
    return { ok: false, error: 'Error al cambiar el rol del usuario.' };
  }
}

export async function toggleUserStatusAction(
  userId: string,
  currentActive: boolean,
): Promise<ActionResult> {
  const session = await requireRole('ADMIN');

  if (userId === session.id) {
    return { ok: false, error: 'No podés desactivar tu propia cuenta.' };
  }

  try {
    await db
      .update(users)
      .set({
        isActive: !currentActive,
        tokenVersion: sql`${users.tokenVersion} + 1`, // Cierra todas las sesiones abiertas
      })
      .where(eq(users.id, userId));

    revalidatePath('/usuarios');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error toggleUserStatusAction:', error);
    return { ok: false, error: 'No se pudo modificar el estado del usuario.' };
  }
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  await requireRole('ADMIN');

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  try {
    const pHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        passwordHash: pHash,
        tokenVersion: sql`${users.tokenVersion} + 1`, // Invalida JWTs previos
      })
      .where(eq(users.id, userId));

    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error resetUserPasswordAction:', error);
    return { ok: false, error: 'Error al restablecer la contraseña.' };
  }
}
