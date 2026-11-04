'use client';

import React, { useActionState, useState } from 'react';
import { Settings, Save, Building, ShieldAlert, FileText, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateGymSettingsAction } from '@/app/actions/settings.actions';
import { IDLE } from '@/types';
import type { GymSettings } from '@/db/schema';

type SettingsTab = 'COMMERCIAL' | 'RULES' | 'RECEIPTS' | 'WHATSAPP';

export function SettingsClient({ settings }: { settings: GymSettings }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('COMMERCIAL');
  const [state, formAction, isPending] = useActionState(
    updateGymSettingsAction,
    IDLE,
  );

  const TABS = [
    { id: 'COMMERCIAL' as SettingsTab, label: 'Datos del Gimnasio', icon: Building },
    { id: 'RULES' as SettingsTab, label: 'Vencimientos y Gracia', icon: ShieldAlert },
    { id: 'RECEIPTS' as SettingsTab, label: 'Recibos PDF', icon: FileText },
    { id: 'WHATSAPP' as SettingsTab, label: 'Plantillas WhatsApp', icon: MessageCircle },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Configuración del Gimnasio
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Parámetros comerciales, días de gracia para vencimientos y datos para los recibos oficiales.
        </p>
      </div>

      {/* Tabs Segmentados con Scroll Táctil */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer min-h-[40px] snap-start active:scale-95 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form action={formAction} className="space-y-6">
        {state.status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-sm font-semibold">
            {state.message}
          </div>
        )}

        {/* 1. Datos Comerciales */}
        <div className={activeTab === 'COMMERCIAL' ? 'block' : 'hidden'}>
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Building className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-zinc-100">
                Datos Comerciales e Impositivos
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del Gimnasio"
                name="gymName"
                defaultValue={settings.gymName}
                required
              />
              <Input
                label="Razón Social / Titular"
                name="legalName"
                defaultValue={settings.legalName || ''}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="CUIT / Identificación Fiscal"
                name="taxId"
                defaultValue={settings.taxId || ''}
              />
              <Input
                label="Teléfono de Contacto"
                name="phone"
                defaultValue={settings.phone || ''}
              />
              <Input
                label="Email de Contacto"
                name="email"
                type="email"
                defaultValue={settings.email || ''}
              />
            </div>

            <Input
              label="Dirección Física"
              name="address"
              defaultValue={settings.address || ''}
            />
          </Card>
        </div>

        {/* 2. Reglas de Vencimiento de Membresías */}
        <div className={activeTab === 'RULES' ? 'block' : 'hidden'}>
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-zinc-100">
                Reglas de Negocio de Vencimientos
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Días de Tolerancia / Período de Gracia"
                  name="gracePeriodDays"
                  type="number"
                  min="0"
                  max="30"
                  defaultValue={settings.gracePeriodDays}
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Días posteriores al vencimiento en que la renovación conserva la fecha del vencimiento anterior.
                </p>
              </div>

              <div>
                <Input
                  label="Alerta Anticipada (Días)"
                  name="expiryWarningDays"
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={settings.expiryWarningDays}
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Desde cuántos días antes se muestra en los paneles la alerta &ldquo;Vence en X días&rdquo;.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Pie de Recibos Oficiales */}
        <div className={activeTab === 'RECEIPTS' ? 'block' : 'hidden'}>
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <FileText className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-semibold text-zinc-100">
                Personalización de Recibos PDF
              </h2>
            </div>

            <Input
              label="Pie de Página del Comprobante"
              name="receiptFooter"
              defaultValue={settings.receiptFooter || ''}
              placeholder="Mensaje de agradecimiento o términos y condiciones breves..."
            />
          </Card>
        </div>

        {/* 4. Plantillas de Mensajes WhatsApp */}
        <div className={activeTab === 'WHATSAPP' ? 'block' : 'hidden'}>
          <Card className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Plantillas de Notificaciones WhatsApp
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Variables dinámicas: <code className="text-emerald-400 font-mono">{"{nombre}"}</code>, <code className="text-emerald-400 font-mono">{"{gimnasio}"}</code>, <code className="text-emerald-400 font-mono">{"{plan}"}</code>, <code className="text-emerald-400 font-mono">{"{fecha_vencimiento}"}</code>, <code className="text-emerald-400 font-mono">{"{monto}"}</code>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mensaje para Cuotas Por Vencer
                </label>
                <textarea
                  name="waTemplateExpiring"
                  defaultValue={settings.waTemplateExpiring}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-base md:text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mensaje para Cuotas Vencidas / En Gracia
                </label>
                <textarea
                  name="waTemplateExpired"
                  defaultValue={settings.waTemplateExpired}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-base md:text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mensaje para Comprobantes de Cobro / Pago
                </label>
                <textarea
                  name="waTemplateReceipt"
                  defaultValue={settings.waTemplateReceipt}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-base md:text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-sans resize-none leading-relaxed"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Botón Guardar siempre accesible */}
        <div className="pt-2 flex flex-col sm:flex-row sm:justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            icon={<Save className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
