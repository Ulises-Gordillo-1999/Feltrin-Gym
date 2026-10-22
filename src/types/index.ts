/** Roles del sistema (duplicado liviano del enum de BD para usar en proxy/cliente sin importar Drizzle). */
export const ROLES = ['ADMIN', 'PROFESOR', 'ALUMNO'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  PROFESOR: 'Profesor',
  ALUMNO: 'Alumno',
};

/** Claims firmados en el JWT de sesión. */
export interface SessionPayload {
  sub: string;
  role: Role;
  name: string;
  ver: number;
}

/** Usuario autenticado y validado contra la BD (DAL). */
export interface SessionUser {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  studentId: string | null;
}

export type FieldErrors = Partial<Record<string, string>>;

/** Estado estándar devuelto por Server Actions usadas con useActionState. */
export type ActionState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors };

export const IDLE: ActionState = { status: 'idle' };

/** Resultado para acciones invocadas directamente (no formularios). */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };
