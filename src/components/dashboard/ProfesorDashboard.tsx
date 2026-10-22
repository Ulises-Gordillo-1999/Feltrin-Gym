import React from 'react';
import Link from 'next/link';
import { Users, ClipboardList, Flame, ArrowRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import { getMembershipStatus } from '@/utils/membership';

export interface ProfesorDashboardProps {
  trainerName: string;
  trainees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    membershipExpiresAt: string | null;
    activeRoutineName: string | null;
  }>;
  totalTemplates: number;
  totalExercises: number;
}

export function ProfesorDashboard({
  trainerName,
  trainees,
  totalTemplates,
  totalExercises,
}: ProfesorDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Panel de Profesor • {trainerName}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Seguimiento de alumnos a tu cargo y armado de rutinas de entrenamiento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/rutinas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Rutina</span>
          </Link>
          <Link
            href="/ejercicios"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 font-medium text-sm border border-zinc-700/80 transition-all"
          >
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Banco de Ejercicios</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Alumnos Asignados
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-zinc-100">
              {trainees.length}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Bajo tu supervisión directa</p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Plantillas de Rutina
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-zinc-100">
              {totalTemplates}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Disponibles para clonar y asignar</p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ejercicios Cargados
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-zinc-100">
              {totalExercises}
            </span>
            <p className="text-xs text-zinc-400 mt-1">En todos los grupos musculares</p>
          </div>
        </Card>
      </div>

      {/* Lista de Alumnos */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">
            Tus Alumnos y Rutinas Asignadas
          </h2>
          <Link
            href="/alumnos"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Ver listado completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {trainees.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            Aún no tenés alumnos asignados. Podes visualizarlos en el listado de Alumnos.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {trainees.map((t) => {
              const status = getMembershipStatus(t.membershipExpiresAt);
              return (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/alumnos/${t.id}`}
                      className="font-medium text-sm text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                      {t.lastName}, {t.firstName}
                    </Link>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Rutina activa:{' '}
                      <span className="text-zinc-200 font-medium">
                        {t.activeRoutineName || 'Sin rutina asignada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={status.status === 'AL_DIA' ? 'emerald' : status.status === 'POR_VENCER' ? 'amber' : 'rose'} dot>
                      {status.label}
                    </Badge>
                    <Link
                      href={`/alumnos/${t.id}`}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      title="Ver ficha de entrenamiento"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
