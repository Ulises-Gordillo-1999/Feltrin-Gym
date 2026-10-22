import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, students } from '@/db/schema';
import { SESSION_COOKIE, sessionTtlSeconds, signSession, verifySession } from './jwt';
import type { Role, SessionUser } from '@/types';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionCookie(user: {
  id: string;
  role: Role;
  fullName: string;
  tokenVersion: number;
}): Promise<void> {
  const token = await signSession({
    sub: user.id,
    role: user.role,
    name: user.fullName,
    ver: user.tokenVersion,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionTtlSeconds(),
    path: '/',
  });
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Data Access Layer (DAL): recupera el usuario validado en la base de datos.
 * Verifica si sigue activo y si el tokenVersion no cambió (logout global).
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload) return null;

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        avatarUrl: true,
      },
    });

    if (!userRow || !userRow.isActive || userRow.tokenVersion !== payload.ver) {
      return null;
    }

    // Si es alumno, buscar si tiene un perfil de estudiante vinculado
    let studentId: string | null = null;
    if (userRow.role === 'ALUMNO') {
      const studentRow = await db.query.students.findFirst({
        where: eq(students.userId, userRow.id),
        columns: { id: true },
      });
      studentId = studentRow?.id ?? null;
    }

    return {
      id: userRow.id,
      role: userRow.role,
      fullName: userRow.fullName,
      email: userRow.email,
      avatarUrl: userRow.avatarUrl,
      studentId,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowed: Role | readonly Role[]): Promise<SessionUser> {
  const session = await requireSession();
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedList.includes(session.role)) {
    redirect('/dashboard');
  }
  return session;
}
