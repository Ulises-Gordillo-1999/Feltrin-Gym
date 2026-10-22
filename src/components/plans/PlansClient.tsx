'use client';

import React, { useState, useActionState, useEffect, useTransition } from 'react';
import { Plus, CreditCard, Check, X, Edit2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createPlanAction, updatePlanAction, togglePlanStatusAction } from '@/app/actions/plans.actions';
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
  const [isTogglePending, startToggleTransition] = useTransition();

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createPlanAction,
    IDLE,
  );
  const [updateState, formUpdateAction, isUpdatePending] = useActionState(
    updatePlanAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') setIsCreateModalOpen(false);
  }, [createState.status]);

  useEffect(() => {
    if (updateState.status === 'success') setEditingPlan(null);
  }, [updateState.status]);

  const handleToggleActive = (plan: PlanItem) => {
    startToggleTransition(async () => {
      await togglePlanStatusAction(plan.id, plan.isActive);
    });
  };

  return (
    <div className="space-y-6">
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
        >
          Nuevo Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card
            key={p.id}
            hover
            className={`flex flex-col justify-between ${
              !p.isActive ? 'opacity-60 border-zinc-900 bg-zinc-950/60' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{p.name}</h3>
                  <Badge variant={p.isActive ? 'emerald' : 'zinc'} size="sm" dot>
                    {p.isActive ? 'Activo' : 'Desactivado'}
                  </Badge>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {formatCurrency(p.price)}
                </span>
                <span className="text-xs text-zinc-400 ml-1.5">
                  / {p.durationValue} {p.durationUnit === 'MES' ? (p.durationValue === 1 ? 'mes' : 'meses') : (p.durationValue === 1 ? 'día' : 'días')}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                {p.description || 'Sin descripción detallada.'}
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-xs text-zinc-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>
                  {p.sessionsPerWeek ? `${p.sessionsPerWeek} días por semana` : 'Pase Libre Ilimitado'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleToggleActive(p)}
                disabled={isTogglePending}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
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
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Editar plan"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Desacoplado con Portal: Crear Plan */}
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
              <option value="6">6 días x semana</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración"
              name="durationValue"
              type="number"
              min="1"
              defaultValue="1"
              required
            />
            <Select label="Unidad" name="durationUnit" defaultValue="MES">
              <option value="MES">Mes(es)</option>
              <option value="DIA">Día(s)</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
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
        title="Modificar Plan de Cuota"
        description="Actualizá los valores del plan. Los recibos ya emitidos conservarán su precio histórico."
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
                <option value="6">6 días x semana</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duración"
                name="durationValue"
                type="number"
                min="1"
                defaultValue={editingPlan.durationValue}
                required
              />
              <Select label="Unidad" name="durationUnit" defaultValue={editingPlan.durationUnit}>
                <option value="MES">Mes(es)</option>
                <option value="DIA">Día(s)</option>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatePending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
