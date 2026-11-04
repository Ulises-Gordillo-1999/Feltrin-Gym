'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarCheck,
  Dumbbell,
  Download,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
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
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Mini cronómetro de descanso en vivo para el gimnasio
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning && activeTimerSeconds !== null && activeTimerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setActiveTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (activeTimerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, activeTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setActiveTimerSeconds(seconds);
    setTimerRunning(true);
  };

  const toggleExerciseComplete = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
  const totalExercises = selectedDayRecord?.exercises.length ?? 0;
  const completedCount = selectedDayRecord?.exercises.filter((ex) => completedExercises.has(ex.id)).length ?? 0;

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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700 w-full sm:w-auto min-h-[44px]"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar Plan Completo en PDF</span>
        </a>
      </div>

      {/* Selector de Días con desplazamiento táctil horizontal suave */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory">
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
              className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer min-w-[130px] snap-start min-h-[44px] active:scale-95 ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {d}
                </span>
                {isToday && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Día de Hoy" />
                )}
              </div>
              <span className="text-xs font-semibold mt-1.5 block text-zinc-200 truncate">
                {dayData?.title || 'Descanso'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block font-medium">
                {count > 0 ? `${count} ejercicios` : 'Recuperación'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating Mini Rest Timer Bar (Temporizador de Descanso para Mobile) */}
      {activeTimerSeconds !== null && (
        <div className="sticky top-20 z-20 flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/95 border border-emerald-500/40 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Tiempo de Descanso</span>
              <span className="text-lg font-mono font-extrabold text-emerald-400">
                {Math.floor(activeTimerSeconds / 60)}:
                {String(activeTimerSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={timerRunning ? 'Pausar' : 'Reanudar'}
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTimerSeconds(null)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar temporizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detalle del Día y Lista de Ejercicios */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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

          {totalExercises > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-zinc-800 w-fit text-xs font-medium text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{completedCount} de {totalExercises} completados</span>
            </div>
          )}
        </div>

        {!selectedDayRecord || selectedDayRecord.exercises.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            <CheckCircle2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-300">Día de recuperación o sin ejercicios asignados</p>
            <p className="text-xs text-zinc-400 mt-1">Aprovechá para hidratarte y descansar adecuadamente.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {selectedDayRecord.exercises.map((ex, index) => {
              const isCompleted = completedExercises.has(ex.id);

              return (
                <div
                  key={ex.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-opacity ${
                    isCompleted ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Botón de Check interactivo para entrenamiento en vivo */}
                    <button
                      type="button"
                      onClick={() => toggleExerciseComplete(ex.id)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 active:scale-95 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400'
                      }`}
                      aria-label={isCompleted ? 'Desmarcar ejercicio' : 'Marcar ejercicio como completado'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </button>

                    <div>
                      <h3
                        className={`font-bold text-sm transition-colors ${
                          isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
                        }`}
                      >
                        {ex.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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

                  {/* Chips de Series x Reps, Carga y Descanso */}
                  <div className="flex items-center gap-3 sm:justify-end pl-12 sm:pl-0 flex-wrap">
                    <div className="text-right bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Series x Reps</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {ex.sets} x {ex.reps}
                      </span>
                    </div>

                    {ex.load && (
                      <div className="text-right bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Carga</span>
                        <span className="text-sm font-semibold text-zinc-200">{ex.load}</span>
                      </div>
                    )}

                    {ex.restSeconds && (
                      <button
                        type="button"
                        onClick={() => startRestTimer(ex.restSeconds!)}
                        className="text-right bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-emerald-500/40 flex items-center gap-1.5 text-zinc-300 text-xs transition-colors cursor-pointer min-h-[38px]"
                        title="Iniciar descanso de este ejercicio"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold">{ex.restSeconds}s</span>
                      </button>
                    )}
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
