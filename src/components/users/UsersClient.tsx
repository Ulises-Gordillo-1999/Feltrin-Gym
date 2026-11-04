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
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
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
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      setFeedbackMessage({ text: 'Usuario creado exitosamente.', type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  }, [createState.status]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    startRoleTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (!res.ok) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      } else {
        setFeedbackMessage({ text: 'Rol de usuario actualizado.', type: 'success' });
      }
      setTimeout(() => setFeedbackMessage(null), 3500);
    });
  };

  const handleToggleStatus = (user: UserItem) => {
    startStatusTransition(async () => {
      const res = await toggleUserStatusAction(user.id, user.isActive);
      if (!res.ok) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      } else {
        setFeedbackMessage({
          text: `Usuario ${user.isActive ? 'suspendido' : 'habilitado'} exitosamente.`,
          type: 'success',
        });
      }
      setTimeout(() => setFeedbackMessage(null), 3500);
    });
  };

  const handleResetPassword = () => {
    if (!resetPasswordUserId || newPassword.length < 6) return;
    startResetTransition(async () => {
      const res = await resetUserPasswordAction(resetPasswordUserId, newPassword);
      if (res.ok) {
        setResetPasswordUserId(null);
        setNewPassword('');
        setFeedbackMessage({
          text: 'Contraseña restablecida con éxito. Las sesiones anteriores fueron revocadas.',
          type: 'success',
        });
      } else {
        setFeedbackMessage({ text: res.error, type: 'error' });
      }
      setTimeout(() => setFeedbackMessage(null), 4500);
    });
  };

  const roleVariants: Record<Role, 'purple' | 'blue' | 'emerald'> = {
    ADMIN: 'purple',
    PROFESOR: 'blue',
    ALUMNO: 'emerald',
  };

  return (
    <div className="space-y-6">
      {/* Header Compacto y Responsivo */}
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
          className="w-full sm:w-auto"
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Banner de retroalimentación en pantalla */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-900 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Tabla y Tarjetas de Usuarios (Patrón Híbrido Responsivo) */}
      <Card className="p-0 overflow-hidden">
        {usersList.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            No se encontraron usuarios registrados en el sistema.
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL: Tarjetas de Usuarios (< md) */}
            <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
              {usersList.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-semibold text-xs shrink-0">
                          <UserIcon className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-zinc-100 truncate block">
                            {u.fullName}{' '}
                            {isSelf && (
                              <span className="text-[10px] text-emerald-400 font-bold ml-1">
                                (Vos)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1 truncate mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" /> {u.email}
                          </span>
                        </div>
                      </div>

                      <Badge variant={u.isActive ? 'emerald' : 'rose'} size="sm" dot>
                        {u.isActive ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </div>

                    {/* Fila de Rol y Último Acceso */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Rol</span>
                        {isSelf ? (
                          <span className="font-semibold text-zinc-200 block mt-0.5">
                            {ROLE_LABELS[u.role]}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            disabled={isRolePending}
                            className="w-full mt-0.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="ADMIN">Administrador</option>
                            <option value="PROFESOR">Profesor</option>
                            <option value="ALUMNO">Alumno</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Último Acceso</span>
                        <span className="text-zinc-400 font-mono text-[11px] block mt-1 truncate">
                          {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Nunca ingresó'}
                        </span>
                      </div>
                    </div>

                    {/* Acciones Táctiles */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordUserId(u.id);
                          setNewPassword('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-zinc-300 bg-zinc-800 hover:bg-zinc-750 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Cambiar Clave</span>
                      </button>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={isStatusPending}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px] ${
                            u.isActive
                              ? 'text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40'
                              : 'text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/40'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Suspender</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Habilitar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VISTA DESKTOP: Tabla Tradicional (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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
                                {u.fullName}{' '}
                                {isSelf && (
                                  <span className="text-[10px] text-emerald-400 font-bold ml-1">
                                    (Vos)
                                  </span>
                                )}
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
          </>
        )}
      </Card>

      {/* Modal Desacoplado: Crear Usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        description="Ingresá los datos del nuevo miembro del equipo y asignale su rol."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input label="Nombre y Apellido" name="fullName" placeholder="Ej. Juan Pérez" required />
          <Input label="Correo Electrónico" name="email" type="email" placeholder="usuario@gmail.com" required />
          <Input label="Contraseña Temporal" name="password" type="password" placeholder="Mínimo 6 caracteres" required />

          <Select label="Rol en el Sistema" name="role" defaultValue="PROFESOR" required>
            <option value="ADMIN">Administrador (Acceso total)</option>
            <option value="PROFESOR">Profesor (Alumnos, rutinas y ejercicios)</option>
            <option value="ALUMNO">Alumno (Autoservicio y rutina personal)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
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
        description="Ingresá la nueva clave de acceso para este usuario. Se revocarán todas sus sesiones activas."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPasswordUserId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleResetPassword}
              disabled={newPassword.length < 6 || isResetPending}
              isLoading={isResetPending}
            >
              Guardar Contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
