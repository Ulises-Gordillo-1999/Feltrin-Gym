'use client';

import React, { useState, useActionState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Download,
  AlertOctagon,
  Dumbbell,
  Clock,
  Plus,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { WhatsAppModal } from '@/components/reminders/WhatsAppModal';
import { registerPaymentAction, voidPaymentAction } from '@/app/actions/payments.actions';
import { assignRoutineToStudentAction } from '@/app/actions/routines.actions';
import { IDLE } from '@/types';
import { formatCurrency, formatDate, formatDni } from '@/utils/format';
import { getMembershipStatus } from '@/utils/membership';

export interface StudentDetailClientProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    medicalNotes: string | null;
    photoUrl: string | null;
    status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
    membershipExpiresAt: string | null;
    lastPaymentAt: Date | null;
    currentPlanId: string | null;
    currentPlanName: string | null;
    trainerName: string | null;
  };
  payments: Array<{
    id: string;
    receiptNumber: number;
    planName: string;
    listPrice: number;
    discount: number;
    amount: number;
    periodStart: string;
    periodEnd: string;
    paymentMethod: string;
    status: 'COMPLETADO' | 'ANULADO';
    paidAt: Date;
    voidReason: string | null;
  }>;
  activeRoutine: {
    id: string;
    name: string;
    goal: string;
    level: string;
    days: Array<{
      id: string;
      dayOfWeek: string;
      title: string;
      notes: string | null;
      exercises: Array<{
        id: string;
        name: string;
        muscleGroup: string;
        sets: number;
        reps: string;
        load: string | null;
        restSeconds: number | null;
        tempo: string | null;
        notes: string | null;
      }>;
    }>;
  } | null;
  plans: Array<{ id: string; name: string; price: number; durationValue: number; durationUnit: string }>;
  availableRoutines: Array<{ id: string; name: string; goal: string; level: string }>;
  isAdmin: boolean;
}

export function StudentDetailClient({
  student,
  payments,
  activeRoutine,
  plans,
  availableRoutines,
  isAdmin,
}: StudentDetailClientProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(student.currentPlanId || (plans[0]?.id ?? ''));
  const [discount, setDiscount] = useState('0');

  // Dialog de anulación
  const [voidPaymentId, setVoidPaymentId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidPending, startVoidTransition] = useTransition();

  // Asignación de rutina
  const [selectedRoutineId, setSelectedRoutineId] = useState(availableRoutines[0]?.id ?? '');
  const [routineNotes, setRoutineNotes] = useState('');
  const [isAssignPending, startAssignTransition] = useTransition();

  const [paymentState, formPaymentAction, isPaymentPending] = useActionState(
    registerPaymentAction,
    IDLE,
  );

  useEffect(() => {
    if (paymentState.status === 'success') {
      setIsPaymentModalOpen(false);
    }
  }, [paymentState.status]);

  const [isWaReminderOpen, setIsWaReminderOpen] = useState(false);
  const [selectedPaymentForWa, setSelectedPaymentForWa] = useState<{
    id: string;
    receiptNumber: number;
    amount: number;
    planName: string;
    periodEnd: string;
  } | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const numDiscount = Math.max(0, parseFloat(discount) || 0);
  const netAmount = Math.max(0, (selectedPlan?.price ?? 0) - numDiscount);

  const statusInfo = getMembershipStatus(student.membershipExpiresAt);

  const handleConfirmVoid = () => {
    if (!voidPaymentId) return;
    startVoidTransition(async () => {
      const res = await voidPaymentAction(voidPaymentId, voidReason || 'Error de cobro');
      if (res.ok) {
        setVoidPaymentId(null);
        setVoidReason('');
      } else {
        alert(res.error);
      }
    });
  };

  const handleAssignRoutine = () => {
    if (!selectedRoutineId) return;
    startAssignTransition(async () => {
      const res = await assignRoutineToStudentAction(selectedRoutineId, student.id, routineNotes);
      if (res.ok) {
        setIsRoutineModalOpen(false);
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/alumnos"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de alumnos</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsPaymentModalOpen(true)}
            icon={<CreditCard className="w-4 h-4" />}
          >
            Cobrar Cuota / Renovar
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsRoutineModalOpen(true)}
            icon={<Dumbbell className="w-4 h-4 text-sky-400" />}
          >
            Asignar Rutina
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsWaReminderOpen(true)}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            icon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
          >
            Aviso WhatsApp
          </Button>
        </div>
      </div>

      {/* Grid Superior: Ficha del Alumno + Estado de Membresía */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Perfil y Datos Personales (2 cols) */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-bold text-xl overflow-hidden shrink-0 shadow-lg">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photoUrl}
                  alt={student.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-zinc-500" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                  {student.lastName}, {student.firstName}
                </h1>
                <Badge
                  variant={student.status === 'ACTIVO' ? 'emerald' : 'zinc'}
                  dot
                >
                  {student.status}
                </Badge>
              </div>

              <p className="text-xs text-zinc-400 mt-1">
                DNI: <span className="font-mono text-zinc-200">{formatDni(student.dni)}</span>
                {student.trainerName && (
                  <span className="ml-3">
                    Profesor: <span className="text-zinc-200 font-medium">{student.trainerName}</span>
                  </span>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{student.phone || 'Sin teléfono registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{student.email || 'Sin correo registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{student.address || 'Sin dirección registrada'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Nacimiento: {formatDate(student.birthDate)}</span>
                </div>
              </div>

              {/* Contacto de Emergencia y Apto Médico */}
              {(student.emergencyContactName || student.medicalNotes) && (
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 text-xs">
                  {student.emergencyContactName && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                      <span className="font-semibold text-zinc-200">Contacto de Emergencia: </span>
                      {student.emergencyContactName} ({student.emergencyContactPhone || 'Sin teléfono'})
                    </div>
                  )}
                  {student.medicalNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-300 flex items-start gap-2">
                      <HeartPulse className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>{student.medicalNotes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Columna Derecha: Tarjeta de Membresía Actual (1 col) */}
        <Card className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Estado de Membresía
              </span>
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
            </div>

            <div className="mt-4">
              <span className="text-xs text-zinc-400 block">Plan Comercial</span>
              <p className="text-lg font-bold text-zinc-100 mt-0.5">
                {student.currentPlanName || 'Sin plan asignado'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">Último Pago</span>
                <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                  {formatDate(student.lastPaymentAt)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block">Vencimiento</span>
                <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                  {formatDate(student.membershipExpiresAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 space-y-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Registrar Nueva Cuota
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => setIsWaReminderOpen(true)}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Enviar Aviso por WhatsApp</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Rutina de Entrenamiento Asignada */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Rutina Activa: {activeRoutine ? activeRoutine.name : 'Sin rutina asignada'}
              </h2>
              {activeRoutine && (
                <p className="text-xs text-zinc-400">
                  Objetivo: {activeRoutine.goal} • Nivel: {activeRoutine.level}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeRoutine && (
              <a
                href={`/api/pdf/routine/${activeRoutine.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar PDF</span>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRoutineModalOpen(true)}
            >
              Cambiar Rutina
            </Button>
          </div>
        </div>

        {activeRoutine && activeRoutine.days.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoutine.days.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {d.dayOfWeek}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">{d.title}</span>
                </div>

                {d.notes && (
                  <p className="text-[11px] text-zinc-400 italic">{d.notes}</p>
                )}

                <div className="space-y-2">
                  {d.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="text-xs flex items-start justify-between gap-2 p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60"
                    >
                      <div>
                        <span className="font-semibold text-zinc-200">
                          {idx + 1}. {ex.name}
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {ex.muscleGroup} {ex.load && `• ${ex.load}`}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0">
                        {ex.sets}x{ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-400">
            El alumno no cuenta con una rutina de ejercicios cargada. Hacé clic en &ldquo;Asignar Rutina&rdquo; para asociarle un plan de entrenamiento.
          </div>
        )}
      </Card>

      {/* Historial de Comprobantes y Pagos */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Historial de Pagos y Cuotas
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Registro contable de mensualidades cobradas y comprobantes oficiales.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Nuevo Cobro
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            No hay pagos registrados para este alumno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Recibo N°</th>
                  <th className="py-3 px-4">Fecha Pago</th>
                  <th className="py-3 px-4">Plan / Concepto</th>
                  <th className="py-3 px-4">Período Cubierto</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payments.map((p) => {
                  const isVoid = p.status === 'ANULADO';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isVoid ? 'opacity-60 bg-zinc-950/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-zinc-300">
                        #{String(p.receiptNumber).padStart(6, '0')}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-xs">
                        {formatDate(p.paidAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-200">
                        {p.planName}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300">
                        {formatDate(p.periodStart)} al {formatDate(p.periodEnd)}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isVoid ? 'rose' : 'emerald'} size="sm" dot>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentForWa({
                                  id: p.id,
                                  receiptNumber: p.receiptNumber,
                                  amount: p.amount,
                                  planName: p.planName,
                                  periodEnd: p.periodEnd,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                              title="Enviar recibo por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          <a
                            href={`/api/pdf/receipt/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>PDF</span>
                          </a>

                          {isAdmin && !isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setVoidPaymentId(p.id);
                                setVoidReason('');
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Anular pago"
                            >
                              <AlertOctagon className="w-4 h-4" />
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
        )}
      </Card>

      {/* Modal Desacoplado: Cobro de Cuota */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Cobro de Mensualidad"
        description={`Registrar cobro para ${student.firstName} ${student.lastName}. El nuevo vencimiento se calcula automáticamente.`}
        maxWidth="lg"
      >
        <form action={formPaymentAction} className="space-y-4">
          <input type="hidden" name="studentId" value={student.id} />

          {paymentState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs font-medium">
              {paymentState.message}
            </div>
          )}

          <Select
            label="Plan a Cobrar"
            name="planId"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            required
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.price)} ({p.durationValue} {p.durationUnit})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Método de Pago" name="paymentMethod" required>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
              <option value="DEBITO">Tarjeta de Débito</option>
              <option value="CREDITO">Tarjeta de Crédito</option>
            </Select>

            <Input
              label="Descuento (ARS)"
              name="discount"
              type="number"
              min="0"
              step="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
            />
          </div>

          <Input
            label="Notas / Observaciones"
            name="notes"
            placeholder="Ej. Promoción familiar, comprobante transferido N° 123..."
          />

          {/* Resumen del cobro */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Precio de lista:</span>
              <span>{formatCurrency(selectedPlan?.price ?? 0)}</span>
            </div>
            {numDiscount > 0 && (
              <div className="flex justify-between text-xs text-rose-400">
                <span>Descuento aplicado:</span>
                <span>-{formatCurrency(numDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-zinc-800">
              <span>Total a Cobrar:</span>
              <span>{formatCurrency(netAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPaymentPending}
            >
              Confirmar Cobro y Generar Recibo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Asignar Rutina */}
      <Modal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        title="Asignar Plan de Entrenamiento"
        description="Seleccioná una plantilla de rutina para clonarla y asociarla al alumno."
        maxWidth="md"
      >
        <div className="space-y-4">
          <Select
            label="Plantilla de Rutina"
            value={selectedRoutineId}
            onChange={(e) => setSelectedRoutineId(e.target.value)}
          >
            {availableRoutines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.goal} • {r.level})
              </option>
            ))}
          </Select>

          <Input
            label="Indicaciones Especiales (Opcional)"
            value={routineNotes}
            onChange={(e) => setRoutineNotes(e.target.value)}
            placeholder="Ej. Evitar impacto en rodilla izquierda, cuidar técnica..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoutineModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAssignRoutine}
              isLoading={isAssignPending}
            >
              Asignar Rutina
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog Desacoplado: Anulación de Pago */}
      <ConfirmDialog
        isOpen={!!voidPaymentId}
        onClose={() => setVoidPaymentId(null)}
        onConfirm={handleConfirmVoid}
        title="¿Anular Comprobante de Pago?"
        message="Esta acción anulará el recibo, reversará el movimiento de ingreso en la caja y recalculará la fecha de vencimiento del alumno al pago anterior. No se puede deshacer."
        confirmText="Anular Pago"
        variant="danger"
        isLoading={isVoidPending}
      />

      {/* Modal WhatsApp: Recordatorio de Vencimiento / Aviso al alumno */}
      <WhatsAppModal
        isOpen={isWaReminderOpen}
        onClose={() => setIsWaReminderOpen(false)}
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        rawPhone={student.phone}
        planName={student.currentPlanName}
        reminderType={statusInfo.status === 'VENCIDA' || statusInfo.status === 'EN_GRACIA' ? 'VENCIDA' : 'POR_VENCER'}
        defaultMessage={
          statusInfo.status === 'VENCIDA' || statusInfo.status === 'EN_GRACIA'
            ? `Hola ${student.firstName}, te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${student.currentPlanName || 'Membresía'} venció el ${formatDate(student.membershipExpiresAt)}. Podés acercarte a recepción o transferir para regularizarla.`
            : `¡Hola ${student.firstName}! Te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${student.currentPlanName || 'Membresía'} vence el ${formatDate(student.membershipExpiresAt)}. ¡Te esperamos para renovar!`
        }
        membershipExpiresAtSnapshot={student.membershipExpiresAt}
      />

      {/* Modal WhatsApp: Enviar Recibo de Pago Oficial */}
      {selectedPaymentForWa && (
        <WhatsAppModal
          isOpen={Boolean(selectedPaymentForWa)}
          onClose={() => setSelectedPaymentForWa(null)}
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
          rawPhone={student.phone}
          planName={selectedPaymentForWa.planName}
          reminderType="RECIBO_PAGO"
          defaultMessage={`¡Hola ${student.firstName}! Registramos con éxito tu pago de ${formatCurrency(selectedPaymentForWa.amount)} por el plan ${selectedPaymentForWa.planName} en Centro de Entrenamiento Feltrin (Recibo #${String(selectedPaymentForWa.receiptNumber).padStart(6, '0')}). Tu membresía está activa hasta el ${formatDate(selectedPaymentForWa.periodEnd)}. ¡Gracias por entrenar con nosotros!`}
          membershipExpiresAtSnapshot={selectedPaymentForWa.periodEnd}
        />
      )}
    </div>
  );
}
