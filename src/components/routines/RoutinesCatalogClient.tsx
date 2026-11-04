'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList, Dumbbell, ArrowRight, UserCheck, Sparkles, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createRoutineAction } from '@/app/actions/routines.actions';
import { IDLE } from '@/types';
import type { RoutineGoal, RoutineLevel } from '@/db/schema';

export interface RoutineCatalogItem {
  id: string;
  name: string;
  description: string | null;
  goal: RoutineGoal;
  level: RoutineLevel;
  isTemplate: boolean;
  creatorName: string;
  daysCount: number;
  exercisesCount: number;
}

export function RoutinesCatalogClient({
  routines,
}: {
  routines: RoutineCatalogItem[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TEMPLATES' | 'CUSTOM'>('ALL');

  const [createState, formCreateAction, isPending] = useActionState(
    createRoutineAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsModalOpen(false);
      const newId = createState.message.split('ID:')[1];
      if (newId) {
        router.push(`/rutinas/${newId}`);
      }
    }
  }, [createState, router]);

  const filteredRoutines = routines.filter((r) => {
    if (filter === 'TEMPLATES') return r.isTemplate;
    if (filter === 'CUSTOM') return !r.isTemplate;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Compacto y Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Planes de Entrenamiento y Rutinas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Armado de rutinas diarias con ejercicios, series, cargas y pausas.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          className="w-full sm:w-auto"
        >
          Crear Nueva Rutina
        </Button>
      </div>

      {/* Filtro Plantillas vs Personalizadas con Scroll Táctil */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-1">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start min-h-[38px] active:scale-95 ${
            filter === 'ALL'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Todas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-700/60 text-zinc-300">
            {routines.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('TEMPLATES')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start min-h-[38px] active:scale-95 ${
            filter === 'TEMPLATES'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Plantillas Base</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
            {routines.filter((r) => r.isTemplate).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('CUSTOM')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start min-h-[38px] active:scale-95 ${
            filter === 'CUSTOM'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Personalizadas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-950/60 text-sky-400 border border-sky-900/40">
            {routines.filter((r) => !r.isTemplate).length}
          </span>
        </button>
      </div>

      {/* Grid de Rutinas o Estado Vacío */}
      {filteredRoutines.length === 0 ? (
        <Card className="py-16 text-center text-zinc-400 text-sm">
          <ClipboardList className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-200 text-base">No hay rutinas disponibles</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {filter === 'TEMPLATES'
              ? 'No hay plantillas base creadas. Creá una para reutilizarla con varios alumnos.'
              : filter === 'CUSTOM'
              ? 'No hay rutinas personalizadas de alumnos creadas todavía.'
              : 'Todavía no hay rutinas cargadas en el sistema.'}
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Crear Rutina Ahora
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutines.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 shadow-sm flex flex-col justify-between space-y-4 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800/60">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                      {r.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant={r.isTemplate ? 'emerald' : 'blue'} size="sm">
                        {r.isTemplate ? 'Plantilla Base' : 'Personalizada'}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {r.goal}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                  {r.description || 'Sin notas adicionales.'}
                </p>

                {/* Chips de Días y Ejercicios */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Días</span>
                      <span className="font-bold text-zinc-200">{r.daysCount} días/sem</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Ejercicios</span>
                      <span className="font-bold text-zinc-200">{r.exercisesCount} total</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 truncate">
                  Por {r.creatorName}
                </span>

                <Link
                  href={`/rutinas/${r.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[38px]"
                >
                  <span>Abrir Rutina</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Desacoplado: Crear Rutina */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Rutina"
        description="Definí los datos iniciales de la rutina. Luego podrás agregar días y ejercicios."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input
            label="Nombre de la Rutina"
            name="name"
            placeholder="Ej. Hipertrofia 4 Días - Nivel Intermedio"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Objetivo Principal" name="goal" required>
              <option value="HIPERTROFIA">Hipertrofia</option>
              <option value="FUERZA">Fuerza</option>
              <option value="RESISTENCIA">Resistencia</option>
              <option value="PERDIDA_GRASA">Pérdida de Grasa</option>
              <option value="SALUD_GENERAL">Salud General</option>
              <option value="REHABILITACION">Rehabilitación</option>
            </Select>

            <Select label="Nivel Requerido" name="level" required>
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Tipo de Rutina
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 cursor-pointer hover:border-zinc-700">
                <input
                  type="radio"
                  name="isTemplate"
                  value="true"
                  defaultChecked
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-zinc-200 font-medium">Plantilla Base</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 cursor-pointer hover:border-zinc-700">
                <input
                  type="radio"
                  name="isTemplate"
                  value="false"
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-zinc-200 font-medium">Personalizada</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Notas Generales
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Instrucciones del plan, semanas de descarga..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-base md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Crear y Continuar al Armador
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
