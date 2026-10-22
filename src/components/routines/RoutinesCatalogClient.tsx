'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList, Dumbbell, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
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
        >
          Crear Nueva Rutina
        </Button>
      </div>

      {/* Filtro Plantillas vs Personalizadas */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl w-fit text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todas ({routines.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('TEMPLATES')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'TEMPLATES'
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Plantillas Base
        </button>
        <button
          type="button"
          onClick={() => setFilter('CUSTOM')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'CUSTOM'
              ? 'bg-sky-950/80 text-sky-400 border border-sky-800/80'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Personalizadas de Alumnos
        </button>
      </div>

      {/* Grid de Rutinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutines.map((r) => (
          <Card key={r.id} hover className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="font-bold text-base text-zinc-100">{r.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={r.isTemplate ? 'emerald' : 'blue'} size="sm">
                      {r.isTemplate ? 'Plantilla Reutilizable' : 'Personalizada'}
                    </Badge>
                    <Badge variant="purple" size="sm">
                      {r.goal}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                {r.description || 'Sin descripción detallada.'}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800/80 text-xs">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Días Programados</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">
                    {r.daysCount} días / sem
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Nivel Técnico</span>
                  <span className="font-bold text-zinc-200 mt-0.5 block">
                    {r.level}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Por: <strong className="text-zinc-300">{r.creatorName}</strong>
              </span>

              <Link
                href={`/rutinas/${r.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all"
              >
                <span>Editar Rutina</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Desacoplado con Portal: Crear Rutina */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Rutina de Entrenamiento"
        description="Definí el nombre, objetivo y nivel. Luego podrás configurar los ejercicios por cada día de la semana."
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
            placeholder="Ej. Hipertrofia Push-Pull-Legs 6 Días"
            required
          />

          <Input
            label="Descripción del Plan"
            name="description"
            placeholder="Ej. Orientada a ganancia de masa muscular y fuerza..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Objetivo Principal" name="goal" defaultValue="HIPERTROFIA">
              <option value="HIPERTROFIA">Hipertrofia</option>
              <option value="FUERZA">Fuerza</option>
              <option value="RESISTENCIA">Resistencia</option>
              <option value="PERDIDA_GRASA">Pérdida de Grasa</option>
              <option value="MOVILIDAD">Movilidad</option>
              <option value="GENERAL">General</option>
            </Select>

            <Select label="Nivel Requerido" name="level" defaultValue="PRINCIPIANTE">
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </Select>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isTemplate"
                value="true"
                defaultChecked
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="text-xs font-semibold text-zinc-200">
                Guardar como Plantilla Reutilizable
              </span>
            </label>
            <p className="text-[11px] text-zinc-400 mt-1 pl-6">
              Las plantillas se pueden clonar y asignar a múltiples alumnos sin alterar el original.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Continuar al Armador de Días
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
