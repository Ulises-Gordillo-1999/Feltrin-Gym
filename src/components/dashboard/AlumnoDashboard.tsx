import React from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CreditCard,
  Download,
  AlertCircle,
  Flame,
  ArrowRight,
  Clock,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import { getMembershipStatus, type MembershipStatusInfo } from '@/utils/membership';
import type { DayOfWeek } from '@/db/schema';

export interface AlumnoDashboardProps {
  student: {
    id: string;
    fullName: string;
    membershipExpiresAt: string | null;
    lastPaymentAt: Date | null;
    currentPlanName: string | null;
    lastPaymentId: string | null;
    lastReceiptNumber: number | null;
  };
  todayDayOfWeek: DayOfWeek;
  todayWorkout: {
    title: string;
    notes: string | null;
    exercises: Array<{
      id: string;
      position: number;
      exerciseName: string;
      muscleGroup: string;
      sets: number;
      reps: string;
      load: string | null;
      restSeconds: number | null;
      tempo: string | null;
      notes: string | null;
    }>;
  } | null;
  activeRoutineName: string | null;
  activeRoutineId: string | null;
}

export function AlumnoDashboard({
  student,
  todayDayOfWeek,
  todayWorkout,
  activeRoutineName,
  activeRoutineId,
}: AlumnoDashboardProps) {
  const statusInfo: MembershipStatusInfo = getMembershipStatus(student.membershipExpiresAt);

  const isExpiringSoon =
    statusInfo.status === 'POR_VENCER' || statusInfo.status === 'EN_GRACIA';
  const isOverdue = statusInfo.status === 'VENCIDA';

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          ¡Hola, {student.fullName}!
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Bienvenido a tu panel de entrenamiento. Acá podés ver el estado de tu cuota y tu rutina de hoy.
        </p>
      </div>

      {/* Alerta de Vencimiento Destacada si corresponde */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-300">
              {statusInfo.label}
            </h3>
            <p className="text-xs text-amber-400/90 mt-0.5">
              Tu mensualidad vence el {formatDate(student.membershipExpiresAt)}. Podés acercarte a recepción para renovar tu cuota y seguir entrenando sin interrupciones.
            </p>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-rose-300">
              Cuota Vencida
            </h3>
            <p className="text-xs text-rose-400/90 mt-0.5">
              Tu mensualidad se encuentra vencida desde el {formatDate(student.membershipExpiresAt)}. Por favor pasá por recepción para regularizar tu pase.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Tarjeta de Mensualidad + Rutina de Hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Estado de la Cuota (1 col) */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Mi Membresía</h2>
              </div>
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

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Plan Contratado
                </span>
                <p className="text-base font-bold text-zinc-100 mt-0.5">
                  {student.currentPlanName || 'Sin plan asignado'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Último Pago</span>
                  <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                    {formatDate(student.lastPaymentAt)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Vencimiento</span>
                  <span className="text-xs font-semibold text-zinc-200 mt-1 block">
                    {formatDate(student.membershipExpiresAt)}
                  </span>
                </div>
              </div>

              {student.lastPaymentId && (
                <div className="pt-2">
                  <a
                    href={`/api/pdf/receipt/${student.lastPaymentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700/80 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Descargar Comprobante #{student.lastReceiptNumber}</span>
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Plan Asignado</h3>
            </div>
            <p className="text-sm font-medium text-zinc-100">
              {activeRoutineName || 'No tenés un plan activo en este momento'}
            </p>
            {activeRoutineId && (
              <Link
                href="/mi-rutina"
                className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
              >
                <span>Ver rutina semanal completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Rutina de Hoy (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Rutina de Hoy ({todayDayOfWeek})
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {todayWorkout ? todayWorkout.title : 'Día de descanso o sin ejercicios programados'}
                  </p>
                </div>
              </div>

              {activeRoutineId && (
                <a
                  href={`/api/pdf/routine/${activeRoutineId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Rutina (PDF)</span>
                </a>
              )}
            </div>

            {/* Contenido de la rutina */}
            <div className="mt-4 flex-1">
              {!todayWorkout || todayWorkout.exercises.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-zinc-200">
                    Hoy no tenés ejercicios programados
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                    Aprovechá para descansar, hacer una sesión de movilidad o consultá con tu profesor para ajustar tu plan.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/mi-rutina"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200"
                    >
                      <span>Ver toda la semana</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayWorkout.notes && (
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">Indicaciones: </span>
                      {todayWorkout.notes}
                    </div>
                  )}

                  <div className="divide-y divide-zinc-800/80">
                    {todayWorkout.exercises.map((ex, index) => (
                      <div
                        key={ex.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-sm text-zinc-100">
                              {ex.exerciseName}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="blue" size="sm">
                                {ex.muscleGroup}
                              </Badge>
                              {ex.tempo && (
                                <span className="text-[11px] text-zinc-400">
                                  Tempo: {ex.tempo}
                                </span>
                              )}
                            </div>
                            {ex.notes && (
                              <p className="text-xs text-zinc-400 mt-1 italic">
                                {ex.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:justify-end pl-9 sm:pl-0">
                          <div className="text-right">
                            <span className="text-xs text-zinc-400 block">Series x Reps</span>
                            <span className="text-sm font-bold text-emerald-400">
                              {ex.sets} x {ex.reps}
                            </span>
                          </div>

                          {ex.load && (
                            <div className="text-right pl-3 border-l border-zinc-800">
                              <span className="text-xs text-zinc-400 block">Carga</span>
                              <span className="text-sm font-semibold text-zinc-200">
                                {ex.load}
                              </span>
                            </div>
                          )}

                          {ex.restSeconds && (
                            <div className="text-right pl-3 border-l border-zinc-800 flex items-center gap-1 text-zinc-400 text-xs">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{ex.restSeconds}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
