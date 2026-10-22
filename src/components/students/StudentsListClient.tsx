'use client';

import React, { useState, useMemo, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, User, Search, Phone, Mail, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Modal } from '@/components/ui/Modal';
import { WhatsAppModal } from '@/components/reminders/WhatsAppModal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createStudentAction } from '@/app/actions/students.actions';
import { IDLE } from '@/types';
import { getMembershipStatus } from '@/utils/membership';
import { formatDate } from '@/utils/format';

export interface StudentItem {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  membershipExpiresAt: string | null;
  currentPlanName: string | null;
  trainerName: string | null;
}

export interface StudentsListClientProps {
  students: StudentItem[];
  plans: Array<{ id: string; name: string; price: number }>;
  trainers: Array<{ id: string; fullName: string }>;
  canCreate: boolean;
}

export function StudentsListClient({
  students,
  plans,
  trainers,
  canCreate,
}: StudentsListClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AL_DIA' | 'POR_VENCER' | 'VENCIDA' | 'INACTIVO'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [selectedStudentForWa, setSelectedStudentForWa] = useState<StudentItem | null>(null);

  const [state, formAction, isPending] = useActionState(createStudentAction, IDLE);

  useEffect(() => {
    if (state.status === 'success') {
      setIsModalOpen(false);
    }
  }, [state.status]);

  // Filtro reactivo en vivo
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.dni.includes(q) ||
        (s.email && s.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'INACTIVO') return s.status === 'INACTIVO';

      const memStatus = getMembershipStatus(s.membershipExpiresAt);
      if (statusFilter === 'AL_DIA') return memStatus.status === 'AL_DIA';
      if (statusFilter === 'POR_VENCER')
        return memStatus.status === 'POR_VENCER' || memStatus.status === 'EN_GRACIA';
      if (statusFilter === 'VENCIDA') return memStatus.status === 'VENCIDA' || memStatus.status === 'SIN_PAGOS';

      return true;
    });
  }, [students, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Gestión de Alumnos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Registro, historial de cuotas y seguimiento de membresías activas.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Nuevo Alumno
          </Button>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, apellido o DNI..."
          className="max-w-md"
        />

        {/* Pestañas de estado */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('AL_DIA')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'AL_DIA'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Al día
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('POR_VENCER')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'POR_VENCER'
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Por vencer
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('VENCIDA')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'VENCIDA'
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vencidas
          </button>
        </div>
      </div>

      {/* Tabla de Alumnos */}
      <Card className="p-0 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            No se encontraron alumnos que coincidan con la búsqueda o filtro aplicado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">DNI / Contacto</th>
                  <th className="py-3 px-4">Plan Actual</th>
                  <th className="py-3 px-4">Estado Cuota</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredStudents.map((st) => {
                  const statusInfo = getMembershipStatus(st.membershipExpiresAt);
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-semibold text-xs overflow-hidden shrink-0">
                            {st.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={st.photoUrl}
                                alt={st.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/alumnos/${st.id}`}
                              className="font-semibold text-zinc-100 hover:text-emerald-400 transition-colors block"
                            >
                              {st.lastName}, {st.firstName}
                            </Link>
                            {st.trainerName && (
                              <span className="text-[11px] text-zinc-400">
                                Profe: {st.trainerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-300">
                        <div className="font-mono text-xs">{st.dni}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          {st.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {st.phone}
                            </span>
                          )}
                          {st.email && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Mail className="w-3 h-3" /> {st.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-300 font-medium">
                        {st.currentPlanName || (
                          <span className="text-zinc-500 italic">Sin plan asignado</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            statusInfo.status === 'AL_DIA'
                              ? 'emerald'
                              : statusInfo.status === 'POR_VENCER'
                              ? 'amber'
                              : statusInfo.status === 'EN_GRACIA'
                              ? 'orange'
                              : 'rose'
                          }
                          dot
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-zinc-300 text-xs">
                        {formatDate(st.membershipExpiresAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st.phone && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForWa(st)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/alumnos/${st.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                          >
                            <span>Ficha</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Desacoplado con React Portal: Alta de Alumno */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Alumno"
        description="Ingresá los datos del alumno. Se puede generar su acceso al sistema y asociar su plan."
        maxWidth="2xl"
      >
        <form action={formAction} className="space-y-4">
          {state.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {state.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="firstName"
              placeholder="Ej. Lucas"
              required
            />
            <Input
              label="Apellido"
              name="lastName"
              placeholder="Ej. Gómez"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="DNI / Documento"
              name="dni"
              placeholder="Ej. 40123456"
              required
            />
            <Input
              label="Fecha de Nacimiento"
              name="birthDate"
              type="date"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="alumno@ejemplo.com"
            />
            <Input
              label="Teléfono / WhatsApp"
              name="phone"
              placeholder="+54 11 1234-5678"
            />
          </div>

          <Input
            label="Dirección"
            name="address"
            placeholder="Calle, número, localidad"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contacto de Emergencia (Nombre)"
              name="emergencyContactName"
              placeholder="Madre, pareja, etc."
            />
            <Input
              label="Teléfono de Emergencia"
              name="emergencyContactPhone"
              placeholder="+54 11 9876-5432"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Plan Inicial" name="currentPlanId">
              <option value="">Seleccionar plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select label="Profesor Asignado" name="assignedTrainerId">
              <option value="">Seleccionar profesor...</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          </div>

          {/* Subida de foto comprimida con sharp */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Foto de Perfil (Opcional - Procesada a WebP)
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          {/* Checkbox para crear cuenta de usuario */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="createUserAccount"
                value="true"
                checked={createUserAccount}
                onChange={(e) => setCreateUserAccount(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="text-xs font-medium text-zinc-200">
                Crear cuenta de acceso para que el alumno ingrese a la app
              </span>
            </label>

            {createUserAccount && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <Input
                  label="Contraseña Temporal"
                  name="temporaryPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required={createUserAccount}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  El alumno podrá iniciar sesión usando su correo electrónico y esta contraseña.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
            >
              Registrar Alumno
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal individual de WhatsApp para alumnos */}
      {selectedStudentForWa && (
        <WhatsAppModal
          isOpen={Boolean(selectedStudentForWa)}
          onClose={() => setSelectedStudentForWa(null)}
          studentId={selectedStudentForWa.id}
          studentName={`${selectedStudentForWa.firstName} ${selectedStudentForWa.lastName}`}
          rawPhone={selectedStudentForWa.phone}
          planName={selectedStudentForWa.currentPlanName}
          reminderType={
            getMembershipStatus(selectedStudentForWa.membershipExpiresAt).status === 'VENCIDA' ||
            getMembershipStatus(selectedStudentForWa.membershipExpiresAt).status === 'EN_GRACIA'
              ? 'VENCIDA'
              : 'POR_VENCER'
          }
          defaultMessage={
            getMembershipStatus(selectedStudentForWa.membershipExpiresAt).status === 'VENCIDA' ||
            getMembershipStatus(selectedStudentForWa.membershipExpiresAt).status === 'EN_GRACIA'
              ? `Hola ${selectedStudentForWa.firstName}, te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${selectedStudentForWa.currentPlanName || 'Membresía'} venció el ${formatDate(selectedStudentForWa.membershipExpiresAt)}. Podés acercarte a recepción o transferir para regularizarla.`
              : `¡Hola ${selectedStudentForWa.firstName}! Te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${selectedStudentForWa.currentPlanName || 'Membresía'} vence el ${formatDate(selectedStudentForWa.membershipExpiresAt)}. ¡Te esperamos para renovar!`
          }
          membershipExpiresAtSnapshot={selectedStudentForWa.membershipExpiresAt}
        />
      )}
    </div>
  );
}
