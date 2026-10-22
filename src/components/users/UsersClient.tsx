'use client';

import React, { useState, useActionState, useEffect, useTransition } from 'react';
import {
  ShieldCheck,
  Plus,
  KeyRound,
  UserCheck,
  UserX,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  createUserAction,
  updateUserRoleAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
} from '@/app/actions/users.actions';
import { IDLE, ROLE_LABELS, type Role } from '@/types';
import { formatDateTime } from '@/utils/format';

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function UsersClient({
  usersList,
  currentUserId,
}: {
  usersList: UserItem[];
  currentUserId: string;
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [isRolePending, startRoleTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createUserAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsCreateModalOpen(false);
    }
  }, [createState.status]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    startRoleTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (!res.ok) alert(res.error);
    });
  };

  const handleToggleStatus = (user: UserItem) => {
    startStatusTransition(async () => {
      const res = await toggleUserStatusAction(user.id, user.isActive);
      if (!res.ok) alert(res.error);
    });
  };

  const handleResetPassword = () => {
    if (!resetPasswordUserId || newPassword.length < 6) return;
    startResetTransition(async () => {
      const res = await resetUserPasswordAction(resetPasswordUserId, newPassword);
      if (res.ok) {
        setResetPasswordUserId(null);
        setNewPassword('');
        alert('Contraseña restablecida con éxito. Las sesiones anteriores fueron revocadas.');
      } else {
        alert(res.error);
      }
    });
  };

  const roleVariants: Record<Role, 'purple' | 'blue' | 'emerald'> = {
    ADMIN: 'purple',
    PROFESOR: 'blue',
    ALUMNO: 'emerald',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Usuarios y Permisos del Sistema
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Control de cuentas, asignación de roles y revocación de accesos.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de Usuarios */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {usersList.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-semibold text-xs">
                          <UserIcon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-100 block">
                            {u.fullName} {isSelf && <span className="text-[10px] text-emerald-400 font-bold ml-1">(Vos)</span>}
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSelf ? (
                        <Badge variant={roleVariants[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          disabled={isRolePending}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ADMIN">Administrador</option>
                          <option value="PROFESOR">Profesor</option>
                          <option value="ALUMNO">Alumno</option>
                        </select>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={u.isActive ? 'emerald' : 'rose'} size="sm" dot>
                        {u.isActive ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Nunca ingresó'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordUserId(u.id);
                            setNewPassword('');
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Restablecer contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isStatusPending}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.isActive
                                ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30'
                                : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30'
                            }`}
                            title={u.isActive ? 'Suspender acceso' : 'Habilitar acceso'}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Desacoplado: Crear Usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Cuenta de Usuario"
        description="Generá una cuenta con credenciales para acceder a la aplicación."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input label="Nombre Completo" name="fullName" placeholder="Ej. Prof. Martín Pérez" required />

          <Input label="Correo Electrónico" name="email" type="email" placeholder="martin@feltrin-gym.com" required />

          <Select label="Rol de Acceso" name="role" defaultValue="PROFESOR" required>
            <option value="ADMIN">Administrador (Control total)</option>
            <option value="PROFESOR">Profesor (Alumnos, rutinas y ejercicios)</option>
            <option value="ALUMNO">Alumno (Mi rutina y mis cuotas)</option>
          </Select>

          <Input
            label="Contraseña de Acceso"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatePending}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Restablecer Contraseña */}
      <Modal
        isOpen={!!resetPasswordUserId}
        onClose={() => setResetPasswordUserId(null)}
        title="Restablecer Contraseña"
        description="Ingresá la nueva clave de acceso. Todas las sesiones activas del usuario se cerrarán de inmediato."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setResetPasswordUserId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={newPassword.length < 6}
              onClick={handleResetPassword}
              isLoading={isResetPending}
            >
              Confirmar Cambio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
