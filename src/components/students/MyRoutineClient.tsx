'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Dumbbell,
  Download,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DayOfWeek } from '@/db/schema';

export interface MyRoutineClientProps {
  routine: {
    id: string;
    name: string;
    goal: string;
    level: string;
    notes: string | null;
    days: Array<{
      id: string;
      dayOfWeek: DayOfWeek;
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
  todayDayOfWeek: DayOfWeek;
}

const DAYS: DayOfWeek[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

export function MyRoutineClient({ routine, todayDayOfWeek }: MyRoutineClientProps) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayDayOfWeek);

  if (!routine) {
    return (
      <Card className="py-16 text-center max-w-lg mx-auto">
        <Dumbbell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-100">Sin Rutina Asignada</h2>
        <p className="text-xs text-zinc-400 mt-2">
          Tu profesor aún no ha cargado tu plan de entrenamiento. Hablá con tu entrenador para que te asigne tu rutina semanal.
        </p>
      </Card>
    );
  }

  const selectedDayRecord = routine.days.find((d) => d.dayOfWeek === activeDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {routine.name}
            </h1>
            <Badge variant="purple">{routine.goal}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Nivel: {routine.level} {routine.notes && `• ${routine.notes}`}
          </p>
        </div>

        <a
          href={`/api/pdf/routine/${routine.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700 w-fit"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar Plan Completo en PDF</span>
        </a>
      </div>

      {/* Tabs de Días de la Semana */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {DAYS.map((d) => {
          const isToday = d === todayDayOfWeek;
          const isSelected = activeDay === d;
          const dayData = routine.days.find((rd) => rd.dayOfWeek === d);
          const count = dayData?.exercises.length ?? 0;

          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer min-w-[125px] ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/40'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {d}
                </span>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Hoy" />
                )}
              </div>
              <span className="text-xs font-semibold mt-1 block text-zinc-200 truncate">
                {dayData?.title || 'Descanso'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {count > 0 ? `${count} ejercicios` : 'Sin rutina'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detalle del Día */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">
                {activeDay}: {selectedDayRecord?.title || 'Descanso'}
              </h2>
              {activeDay === todayDayOfWeek && (
                <Badge variant="emerald" size="sm">
                  Día de Hoy
                </Badge>
              )}
            </div>
            {selectedDayRecord?.notes && (
              <p className="text-xs text-zinc-400 mt-1">
                {selectedDayRecord.notes}
              </p>
            )}
          </div>
        </div>

        {!selectedDayRecord || selectedDayRecord.exercises.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-300">Día de recuperación o sin ejercicios asignados</p>
            <p className="text-xs text-zinc-400 mt-1">Aprovechá para hidratarte y descansar adecuadamente.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {selectedDayRecord.exercises.map((ex, index) => (
              <div
                key={ex.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{ex.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="blue" size="sm">
                        {ex.muscleGroup}
                      </Badge>
                      {ex.tempo && (
                        <span className="text-[11px] text-zinc-400">Tempo: {ex.tempo}</span>
                      )}
                    </div>
                    {ex.notes && (
                      <p className="text-xs text-zinc-400 mt-1.5 italic">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end pl-10 sm:pl-0">
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block">Series x Reps</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {ex.sets} x {ex.reps}
                    </span>
                  </div>

                  {ex.load && (
                    <div className="text-right pl-3 border-l border-zinc-800">
                      <span className="text-[11px] text-zinc-400 block">Carga</span>
                      <span className="text-sm font-semibold text-zinc-200">{ex.load}</span>
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
        )}
      </Card>
    </div>
  );
}
