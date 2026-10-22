import type { Role } from '@/types';

const ALL: readonly Role[] = ['ADMIN', 'PROFESOR', 'ALUMNO'];
const STAFF: readonly Role[] = ['ADMIN', 'PROFESOR'];
const ADMIN: readonly Role[] = ['ADMIN'];
const ALUMNO: readonly Role[] = ['ALUMNO'];

/**
 * Matriz RBAC por prefijo de ruta. Fuente única de verdad para proxy.ts y el Sidebar.
 * Las Server Actions vuelven a validar con requireRole() (defensa en profundidad).
 */
export const ROUTE_ACCESS: ReadonlyArray<{ prefix: string; roles: readonly Role[] }> = [
  { prefix: '/dashboard', roles: ALL },
  { prefix: '/alumnos', roles: STAFF },
  { prefix: '/rutinas', roles: STAFF },
  { prefix: '/ejercicios', roles: STAFF },
  { prefix: '/planes', roles: ADMIN },
  { prefix: '/finanzas', roles: ADMIN },
  { prefix: '/inventario', roles: ADMIN },
  { prefix: '/ventas', roles: ADMIN },
  { prefix: '/usuarios', roles: ADMIN },
  { prefix: '/configuracion', roles: ADMIN },
  { prefix: '/mi-rutina', roles: ALUMNO },
  { prefix: '/mis-pagos', roles: ALUMNO },
];

export function canAccess(pathname: string, role: Role): boolean {
  const rule = ROUTE_ACCESS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  // Rutas protegidas no listadas: solo ADMIN (deny-by-default para el resto).
  return rule ? rule.roles.includes(role) : role === 'ADMIN';
}

export function isProtectedPath(pathname: string): boolean {
  return pathname !== '/login';
}

export const STAFF_ROLES = STAFF;
