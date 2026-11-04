'use client';

import React, { useState, useActionState, useEffect, useTransition } from 'react';
import { Plus, CreditCard, Calendar, Edit2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  createPlanAction,
  updatePlanAction,
  togglePlanStatusAction,
} from '@/app/actions/plans.actions';
import { IDLE } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationValue: number;
  durationUnit: 'DIA' | 'MES';
  sessionsPerWeek: number | null;
  isActive: boolean;
}

export function PlansClient({ plans }: { plans: PlanItem[] }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createPlanAction,
    IDLE,
  );

  const [updateState, formUpdateAction, isUpdatePending] = useActionState(
    updatePlanAction,
    IDLE,
  );

  const [isTogglePending, startToggleTransition] = useTransition();

  useEffect(() => {
    if (createState.status === 'success') {
      setIsCreateModalOpen(false);
    }
  }, [createState.status]);

  useEffect(() => {
    if (updateState.status === 'success') {
      setEditingPlan(null);
    }
  }, [updateState.status]);

  const handleToggleActive = (plan: PlanItem) => {
    startToggleTransition(async () => {
      await togglePlanStatusAction(plan.id, plan.isActive);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Compacto y Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Planes de Membresía
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configuración de cuotas, pases y frecuencias de entrenamiento.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          className="w-full sm:w-auto"
        >
          Nuevo Plan
        </Button>
      </div>

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
              p.isActive
                ? 'bg-zinc-900/70 border-zinc-800/80 hover:border-emerald-500/40 shadow-sm'
                : 'opacity-60 border-zinc-900 bg-zinc-950/60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-zinc-100 truncate">{p.name}</h3>
                  <div className="mt-1">
                    <Badge variant={p.isActive ? 'emerald' : 'zinc'} size="sm" dot>
                      {p.isActive ? 'Activo' : 'Desactivado'}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                  {formatCurrency(p.price)}
                </span>
                <span className="text-xs text-zinc-400 ml-1.5 font-sans">
                  / {p.durationValue} {p.durationUnit === 'MES' ? (p.durationValue === 1 ? 'mes' : 'meses') : (p.durationValue === 1 ? 'día' : 'días')}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed line-clamp-2">
                {p.description || 'Acceso al gimnasio según duración pactada.'}
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 text-xs text-zinc-300 flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-zinc-200">
                  {p.sessionsPerWeek ? `${p.sessionsPerWeek} días por semana` : 'Pase Libre Ilimitado'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleToggleActive(p)}
                disabled={isTogglePending}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] ${
                  p.isActive
                    ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    : 'border-emerald-800/80 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60'
                }`}
              >
                {p.isActive ? 'Desactivar' : 'Reactivar'}
              </button>

              <button
                type="button"
                onClick={() => setEditingPlan(p)}
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-transparent hover:border-zinc-700"
                title="Editar plan"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Desacoplado: Crear Plan */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Plan de Cuota"
        description="Definí el nombre comercial, el precio y la duración de la membresía."
        maxWidth="md"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <Input label="Nombre del Plan" name="name" placeholder="Ej. Pase Libre Musculación" required />

          <Input
            label="Descripción"
            name="description"
            placeholder="Ej. Acceso ilimitado de lunes a sábados..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio (ARS)"
              name="price"
              type="number"
              inputMode="decimal"
              step="100"
              placeholder="35000"
              required
            />
            <Select label="Días por Semana" name="sessionsPerWeek">
              <option value="">Pase Libre</option>
              <option value="1">1 día x semana</option>
              <option value="2">2 días x semana</option>
              <option value="3">3 días x semana</option>
              <option value="4">4 días x semana</option>
              <option value="5">5 días x semana</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (Valor)"
              name="durationValue"
              type="number"
              inputMode="numeric"
              defaultValue="1"
              min="1"
              required
            />
            <Select label="Unidad de Duración" name="durationUnit" defaultValue="MES">
              <option value="MES">Meses</option>
              <option value="DIA">Días</option>
            </Select>
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
              Crear Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Editar Plan */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title="Editar Plan de Membresía"
        description="Actualizá el precio o las condiciones de este plan."
        maxWidth="md"
      >
        {editingPlan && (
          <form action={formUpdateAction} className="space-y-4">
            <input type="hidden" name="id" value={editingPlan.id} />

            {updateState.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
                {updateState.message}
              </div>
            )}

            <Input
              label="Nombre del Plan"
              name="name"
              defaultValue={editingPlan.name}
              required
            />

            <Input
              label="Descripción"
              name="description"
              defaultValue={editingPlan.description || ''}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio (ARS)"
                name="price"
                type="number"
                inputMode="decimal"
                step="100"
                defaultValue={editingPlan.price}
                required
              />
              <Select
                label="Días por Semana"
                name="sessionsPerWeek"
                defaultValue={editingPlan.sessionsPerWeek ? String(editingPlan.sessionsPerWeek) : ''}
              >
                <option value="">Pase Libre</option>
                <option value="1">1 día x semana</option>
                <option value="2">2 días x semana</option>
                <option value="3">3 días x semana</option>
                <option value="4">4 días x semana</option>
                <option value="5">5 días x semana</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duración"
                name="durationValue"
                type="number"
                inputMode="numeric"
                defaultValue={editingPlan.durationValue}
                min="1"
                required
              />
              <Select
                label="Unidad"
                name="durationUnit"
                defaultValue={editingPlan.durationUnit}
              >
                <option value="MES">Meses</option>
                <option value="DIA">Días</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPlan(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatePending}>
                Actualizar Plan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
