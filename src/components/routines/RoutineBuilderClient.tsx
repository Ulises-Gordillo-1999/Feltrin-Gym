'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Download,
  UserCheck,
  Dumbbell,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { saveRoutineDayAction, assignRoutineToStudentAction, type DayExerciseInput } from '@/app/actions/routines.actions';
import type { DayOfWeek } from '@/db/schema';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface DayData {
  id?: string;
  dayOfWeek: DayOfWeek;
  title: string;
  notes: string | null;
  exercises: Array<{
    id?: string;
    exerciseId: string;
    position: number;
    sets: number;
    reps: string;
    load: string | null;
    restSeconds: number | null;
    tempo: string | null;
    notes: string | null;
  }>;
}

export interface RoutineBuilderClientProps {
  routine: {
    id: string;
    name: string;
    description: string | null;
    goal: string;
    level: string;
    isTemplate: boolean;
    days: DayData[];
  };
  exerciseLibrary: ExerciseLibraryItem[];
  students: Array<{ id: string; fullName: string; dni: string }>;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

export function RoutineBuilderClient({
  routine,
  exerciseLibrary,
  students,
}: RoutineBuilderClientProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('LUNES');
  const [daysState, setDaysState] = useState<Record<DayOfWeek, DayData>>(() => {
    const map: Partial<Record<DayOfWeek, DayData>> = {};
    for (const d of DAYS_OF_WEEK) {
      const existing = routine.days.find((rd) => rd.dayOfWeek === d);
      map[d] = existing ?? {
        dayOfWeek: d,
        title: d === 'DOMINGO' ? 'Descanso' : `Entrenamiento ${d}`,
        notes: '',
        exercises: [],
      };
    }
    return map as Record<DayOfWeek, DayData>;
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState(students[0]?.id ?? '');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssignPending, startAssignTransition] = useTransition();

  const [isSavePending, startSaveTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentDayData = daysState[selectedDay];

  const handleTitleChange = (newTitle: string) => {
    setDaysState((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], title: newTitle },
    }));
  };

  const handleNotesChange = (newNotes: string) => {
    setDaysState((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], notes: newNotes },
    }));
  };

  const handleAddExercise = () => {
    if (exerciseLibrary.length === 0) return;
    const firstEx = exerciseLibrary[0];
    const newEx: DayExerciseInput = {
      exerciseId: firstEx.id,
      position: currentDayData.exercises.length + 1,
      sets: 3,
      reps: '10',
      load: '',
      restSeconds: 60,
      tempo: '',
      notes: '',
    };

    setDaysState((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        exercises: [...prev[selectedDay].exercises, newEx],
      },
    }));
  };

  const handleRemoveExercise = (index: number) => {
    setDaysState((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        exercises: prev[selectedDay].exercises.filter((_, i) => i !== index),
      },
    }));
  };

  const handleExerciseChange = (index: number, field: string, value: unknown) => {
    setDaysState((prev) => {
      const updated = [...prev[selectedDay].exercises];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        [selectedDay]: { ...prev[selectedDay], exercises: updated },
      };
    });
  };

  const handleSaveDay = () => {
    startSaveTransition(async () => {
      const res = await saveRoutineDayAction(
        routine.id,
        selectedDay,
        currentDayData.title,
        currentDayData.notes || null,
        currentDayData.exercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          position: idx + 1,
          sets: Number(e.sets) || 3,
          reps: String(e.reps) || '10',
          load: e.load || null,
          restSeconds: e.restSeconds ? Number(e.restSeconds) : null,
          tempo: e.tempo || null,
          notes: e.notes || null,
        })),
      );

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.error);
      }
    });
  };

  const handleAssignToStudent = () => {
    if (!assignStudentId) return;
    startAssignTransition(async () => {
      const res = await assignRoutineToStudentAction(
        routine.id,
        assignStudentId,
        assignNotes,
      );
      if (res.ok) {
        setIsAssignModalOpen(false);
        alert('¡Rutina asignada exitosamente al alumno!');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/rutinas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo de rutinas</span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={`/api/pdf/routine/${routine.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar PDF</span>
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            icon={<UserCheck className="w-4 h-4" />}
          >
            Asignar a Alumno
          </Button>
        </div>
      </div>

      {/* Routine Metadata Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                {routine.name}
              </h1>
              <Badge variant={routine.isTemplate ? 'emerald' : 'blue'}>
                {routine.isTemplate ? 'Plantilla Base' : 'Personalizada'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Objetivo: <strong className="text-zinc-200">{routine.goal}</strong> • Nivel: <strong className="text-zinc-200">{routine.level}</strong>
            </p>
          </div>
        </div>
        {routine.description && (
          <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
            {routine.description}
          </p>
        )}
      </Card>

      {/* Selector de Días de la Semana */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {DAYS_OF_WEEK.map((day) => {
          const exCount = daysState[day].exercises.length;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer min-w-[130px] ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-950/40 text-emerald-300'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                {day}
              </span>
              <span className="text-xs font-semibold mt-1 block text-zinc-200 truncate max-w-[110px]">
                {daysState[day].title}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {exCount} {exCount === 1 ? 'ejercicio' : 'ejercicios'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Editor del Día Seleccionado */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Nombre o Enfoque del {selectedDay}
            </label>
            <input
              type="text"
              value={currentDayData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej. Pecho, Hombros y Tríceps (Fuerza)"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddExercise}
              icon={<Plus className="w-4 h-4" />}
            >
              Agregar Ejercicio
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDay}
              isLoading={isSavePending}
              icon={<Save className="w-4 h-4" />}
            >
              Guardar {selectedDay}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
            ✓ ¡Día {selectedDay} guardado con éxito!
          </div>
        )}

        <Input
          label="Indicaciones o Notas del Día (Opcional)"
          value={currentDayData.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Ej. Realizar 10 min de calentamiento en cinta + movilidad articular antes de empezar..."
        />

        {/* Lista de Ejercicios del Día */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ejercicios Programados ({currentDayData.exercises.length})
          </h3>

          {currentDayData.exercises.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
              No hay ejercicios cargados para el día {selectedDay}. Hacé clic en &ldquo;Agregar Ejercicio&rdquo;.
            </div>
          ) : (
            <div className="space-y-3">
              {currentDayData.exercises.map((ex, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/70 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-1">
                      <select
                        value={ex.exerciseId}
                        onChange={(e) => handleExerciseChange(index, 'exerciseId', e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {exerciseLibrary.map((el) => (
                          <option key={el.id} value={el.id}>
                            {el.name} ({el.muscleGroup})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Campos técnicos: series, reps, carga, pausa, tempo, notas */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                        Series
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-100 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                        Repeticiones
                      </label>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                        placeholder="8-10 / AMRAP"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                        Carga / Peso
                      </label>
                      <input
                        type="text"
                        value={ex.load || ''}
                        onChange={(e) => handleExerciseChange(index, 'load', e.target.value)}
                        placeholder="60 kg / RPE 8"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                        Pausa (Seg)
                      </label>
                      <input
                        type="number"
                        step="15"
                        value={ex.restSeconds || ''}
                        onChange={(e) => handleExerciseChange(index, 'restSeconds', parseInt(e.target.value, 10) || null)}
                        placeholder="60s / 90s"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                        Tempo
                      </label>
                      <input
                        type="text"
                        value={ex.tempo || ''}
                        onChange={(e) => handleExerciseChange(index, 'tempo', e.target.value)}
                        placeholder="3-0-1-0"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={ex.notes || ''}
                    onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                    placeholder="Instrucciones o recomendaciones específicas para este ejercicio..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 italic"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal Desacoplado con Portal: Asignar a Alumno */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Asignar Rutina a un Alumno"
        description="Si la rutina es una plantilla, se clonará de forma independiente para que puedas adaptarla sin modificar el molde base."
        maxWidth="md"
      >
        <div className="space-y-4">
          <Select
            label="Seleccionar Alumno"
            value={assignStudentId}
            onChange={(e) => setAssignStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} (DNI: {s.dni})
              </option>
            ))}
          </Select>

          <Input
            label="Notas de Asignación (Opcional)"
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
            placeholder="Ej. Iniciar con cargas moderadas la primer semana..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAssignToStudent}
              isLoading={isAssignPending}
            >
              Confirmar Asignación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
