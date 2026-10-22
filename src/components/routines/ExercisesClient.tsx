'use client';

import React, { useState, useMemo, useActionState, useEffect } from 'react';
import { Plus, Flame, Search, Video, Dumbbell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createExerciseAction } from '@/app/actions/exercises.actions';
import { IDLE } from '@/types';
import type { MuscleGroup } from '@/db/schema';

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string | null;
  description: string | null;
  videoUrl: string | null;
  isActive: boolean;
}

const MUSCLE_GROUPS: Array<{ value: MuscleGroup | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PECHO', label: 'Pecho' },
  { value: 'ESPALDA', label: 'Espalda' },
  { value: 'HOMBROS', label: 'Hombros' },
  { value: 'CUADRICEPS', label: 'Cuádriceps' },
  { value: 'ISQUIOTIBIALES', label: 'Isquios' },
  { value: 'GLUTEOS', label: 'Glúteos' },
  { value: 'BICEPS', label: 'Bíceps' },
  { value: 'TRICEPS', label: 'Tríceps' },
  { value: 'ABDOMEN', label: 'Abdomen' },
  { value: 'CARDIO', label: 'Cardio' },
];

export function ExercisesClient({ exercises }: { exercises: ExerciseItem[] }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createExerciseAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsModalOpen(false);
    }
  }, [createState.status]);

  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(q));

      const matchesMuscle = muscleFilter === 'ALL' || ex.muscleGroup === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, muscleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Banco de Ejercicios
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Biblioteca de ejercicios clasificados por grupo muscular y equipamiento.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Buscador y Pestañas por Grupo Muscular */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar ejercicio o equipamiento..."
        />

        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto text-xs">
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg.value}
              type="button"
              onClick={() => setMuscleFilter(mg.value)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                muscleFilter === mg.value
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Ejercicios */}
      {filteredExercises.length === 0 ? (
        <Card className="py-16 text-center text-zinc-400 text-sm">
          No se encontraron ejercicios con los criterios seleccionados.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => (
            <Card key={ex.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-zinc-100 leading-snug">
                    {ex.name}
                  </h3>
                  <Badge variant="blue" size="sm">
                    {ex.muscleGroup}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-300">
                  <Dumbbell className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{ex.equipment || 'Equipamiento libre / Corporal'}</span>
                </div>

                {ex.description && (
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
                    {ex.description}
                  </p>
                )}
              </div>

              {ex.videoUrl && (
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Ver Video de Técnica</span>
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Desacoplado con Portal: Nuevo Ejercicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agregar Ejercicio a la Biblioteca"
        description="Ingresá los datos del ejercicio para que los profesores puedan incluirlo en las rutinas."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input
            label="Nombre del Ejercicio"
            name="name"
            placeholder="Ej. Press Militar con Barra"
            required
          />

          <Select label="Grupo Muscular" name="muscleGroup" required>
            <option value="PECHO">Pecho</option>
            <option value="ESPALDA">Espalda</option>
            <option value="HOMBROS">Hombros</option>
            <option value="BICEPS">Bíceps</option>
            <option value="TRICEPS">Tríceps</option>
            <option value="CUADRICEPS">Cuádriceps</option>
            <option value="ISQUIOTIBIALES">Isquiotibiales</option>
            <option value="GLUTEOS">Glúteos</option>
            <option value="PANTORRILLAS">Pantorrillas</option>
            <option value="ABDOMEN">Abdomen</option>
            <option value="CARDIO">Cardio</option>
            <option value="MOVILIDAD">Movilidad</option>
          </Select>

          <Input
            label="Equipamiento Requerido"
            name="equipment"
            placeholder="Ej. Barra Olímpica, Mancuernas, Polea Alta..."
          />

          <Input
            label="Instrucciones o Claves de Técnica (Opcional)"
            name="description"
            placeholder="Ej. Codos a 45 grados, retracción escapular..."
          />

          <Input
            label="Enlace a Video Demostrativo (Opcional)"
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatePending}>
              Guardar Ejercicio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
