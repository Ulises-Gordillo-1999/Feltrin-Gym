'use client';

import React, { useState, useMemo, useActionState, useEffect, useTransition } from 'react';
import { Plus, Dumbbell, Video, Pencil, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
} from '@/app/actions/exercises.actions';
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
  { value: 'MOVILIDAD', label: 'Movilidad' },
];

export function ExercisesClient({ exercises }: { exercises: ExerciseItem[] }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'ALL'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<ExerciseItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isDeletePending, startDeleteTransition] = useTransition();

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createExerciseAction,
    IDLE,
  );

  const [updateState, formUpdateAction, isUpdatePending] = useActionState(
    updateExerciseAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsCreateModalOpen(false);
    }
  }, [createState.status]);

  useEffect(() => {
    if (updateState.status === 'success') {
      setEditingExercise(null);
    }
  }, [updateState.status]);

  const handleDelete = () => {
    if (!deletingExercise) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteExerciseAction(deletingExercise.id);
      if (!res.ok) {
        setDeleteError(res.error || 'No se pudo eliminar el ejercicio.');
      } else {
        setDeletingExercise(null);
      }
    });
  };

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
      {/* Header Compacto */}
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
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          className="w-full sm:w-auto"
        >
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Buscador y Carrusel Táctil por Grupo Muscular */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar ejercicio o equipamiento..."
          className="w-full"
        />

        {/* Carrusel táctil horizontal con snap */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-1">
          {MUSCLE_GROUPS.map((mg) => {
            const count =
              mg.value === 'ALL'
                ? exercises.length
                : exercises.filter((e) => e.muscleGroup === mg.value).length;
            const isSelected = muscleFilter === mg.value;

            return (
              <button
                key={mg.value}
                type="button"
                onClick={() => setMuscleFilter(mg.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer shrink-0 snap-start text-xs min-h-[38px] active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span>{mg.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Ejercicios */}
      {filteredExercises.length === 0 ? (
        <Card className="py-16 text-center text-zinc-400 text-sm">
          <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="font-semibold text-zinc-300">No se encontraron ejercicios</p>
          <p className="text-xs text-zinc-500 mt-1">
            Probá cambiando el filtro muscular o tocá &ldquo;Nuevo Ejercicio&rdquo; para agregarlo.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 shadow-sm flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-zinc-100 leading-snug">
                    {ex.name}
                  </h3>
                  <Badge variant="blue" size="sm">
                    {ex.muscleGroup}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                  <Dumbbell className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{ex.equipment || 'Equipamiento libre / Corporal'}</span>
                </div>

                {ex.description && (
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                <div>
                  {ex.videoUrl ? (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-zinc-600 italic">Sin video</span>
                  )}
                </div>

                {/* Acciones con área táctil cómoda */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingExercise(ex)}
                    title="Editar ejercicio"
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingExercise(ex);
                    }}
                    title="Eliminar ejercicio"
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Desacoplado: Crear Ejercicio */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Ejercicio"
        description="Ingresá los datos del ejercicio para sumarlo a la biblioteca técnica."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input label="Nombre del Ejercicio" name="name" placeholder="Ej. Press Banca Plano" required />

          <Select label="Grupo Muscular Principal" name="muscleGroup" required>
            {MUSCLE_GROUPS.filter((m) => m.value !== 'ALL').map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>

          <Input
            label="Equipamiento Requerido"
            name="equipment"
            placeholder="Ej. Barra olímpica, banco plano..."
          />

          <Input
            label="URL de Video Demostrativo (Opcional)"
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Instrucciones / Notas Técnicas
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Postura inicial, respiración, agarre..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-base md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatePending}>
              Guardar Ejercicio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Editar Ejercicio */}
      <Modal
        isOpen={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        title="Editar Ejercicio"
        description="Modificá el nombre, grupo muscular o datos del ejercicio."
        maxWidth="md"
      >
        {editingExercise && (
          <form action={formUpdateAction} className="space-y-4">
            <input type="hidden" name="id" value={editingExercise.id} />

            {updateState.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
                {updateState.message}
              </div>
            )}

            <Input
              label="Nombre del Ejercicio"
              name="name"
              defaultValue={editingExercise.name}
              required
            />

            <Select
              label="Grupo Muscular"
              name="muscleGroup"
              defaultValue={editingExercise.muscleGroup}
              required
            >
              {MUSCLE_GROUPS.filter((m) => m.value !== 'ALL').map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>

            <Input
              label="Equipamiento"
              name="equipment"
              defaultValue={editingExercise.equipment || ''}
            />

            <Input
              label="Video de Técnica (URL)"
              name="videoUrl"
              type="url"
              defaultValue={editingExercise.videoUrl || ''}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Instrucciones / Notas Técnicas
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingExercise.description || ''}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-base md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingExercise(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatePending}>
                Actualizar Ejercicio
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Desacoplado: Eliminar Ejercicio */}
      <Modal
        isOpen={!!deletingExercise}
        onClose={() => setDeletingExercise(null)}
        title="¿Eliminar Ejercicio?"
        description="Esta acción eliminará el ejercicio del catálogo general."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            ¿Estás seguro de que querés eliminar el ejercicio{' '}
            <strong className="text-zinc-100 font-bold">{deletingExercise?.name}</strong>?
          </p>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExercise(null)}
              disabled={isDeletePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeletePending}
            >
              Confirmar Eliminación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
