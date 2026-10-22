'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Plus,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { getMembershipStatus } from '@/utils/membership';
import { DailyRemindersModal } from '@/components/reminders/DailyRemindersModal';
import { WhatsAppModal } from '@/components/reminders/WhatsAppModal';

export interface AdminDashboardProps {
  stats: {
    totalStudents: number;
    activeStudents: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netBalance: number;
  };
  expiringStudents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string | null;
    membershipExpiresAt: string | null;
    currentPlanName: string | null;
  }>;
  lowStockProducts: Array<{
    id: string;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
  recentPayments: Array<{
    id: string;
    receiptNumber: number;
    studentName: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    paidAt: Date;
  }>;
}

export function AdminDashboard({
  stats,
  expiringStudents,
  lowStockProducts,
  recentPayments,
}: AdminDashboardProps) {
  const [dailyRemindersOpen, setDailyRemindersOpen] = useState(false);
  const [selectedStudentForWa, setSelectedStudentForWa] = useState<{
    id: string;
    name: string;
    phone: string | null;
    planName: string | null;
    status: 'POR_VENCER' | 'VENCIDA';
    expiresAt: string | null;
  } | null>(null);
  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Panel de Control General
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Resumen en tiempo real de finanzas, socios e inventario del gimnasio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/alumnos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Alumno</span>
          </Link>
          <Link
            href="/finanzas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 font-medium text-sm border border-zinc-700/80 transition-all"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Caja / Gastos</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alumnos Activos */}
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Alumnos Activos
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-zinc-100 tracking-tight">
              {stats.activeStudents}
            </span>
            <span className="text-xs text-zinc-400 ml-2">de {stats.totalStudents} registrados</span>
          </div>
        </Card>

        {/* Ingresos del Mes */}
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ingresos del Mes
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formatCurrency(stats.monthlyIncome)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Cuotas + ventas de mostrador</p>
          </div>
        </Card>

        {/* Egresos del Mes */}
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Egresos del Mes
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              {formatCurrency(stats.monthlyExpenses)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Gastos y servicios operativos</p>
          </div>
        </Card>

        {/* Balance Neto */}
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Balance Neto
            </span>
            <div
              className={`p-2 rounded-xl border ${
                stats.netBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                stats.netBalance >= 0 ? 'text-zinc-100' : 'text-rose-400'
              }`}
            >
              {formatCurrency(stats.netBalance)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Resultado económico acumulado</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Vencimientos y Cobros Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Alumnos por Vencer o Vencidos (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-zinc-100">
                  Próximos Vencimientos y Cuotas
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDailyRemindersOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer shadow-sm hover:shadow-emerald-950/40 group whitespace-nowrap active:scale-95"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <MessageCircle className="w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0" />
                  <span>Avisos WhatsApp</span>
                </button>

                <Link
                  href="/alumnos"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-1 transition-colors"
                >
                  <span>Ver todos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {expiringStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                No hay alumnos con cuotas por vencer en los próximos días.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {expiringStudents.map((st) => {
                  const statusInfo = getMembershipStatus(st.membershipExpiresAt);
                  return (
                    <div
                      key={st.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/alumnos/${st.id}`}
                          className="font-medium text-sm text-zinc-100 hover:text-emerald-400 transition-colors truncate block"
                        >
                          {st.lastName}, {st.firstName}
                        </Link>
                        <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>DNI: {st.dni}</span>
                          <span>•</span>
                          <span>{st.currentPlanName || 'Sin plan'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <Badge variant={statusInfo.status === 'VENCIDA' ? 'rose' : statusInfo.status === 'EN_GRACIA' ? 'orange' : statusInfo.status === 'POR_VENCER' ? 'amber' : 'emerald'} dot>
                            {statusInfo.label}
                          </Badge>
                          <div className="text-[11px] text-zinc-400 mt-1">
                            Vence: {formatDate(st.membershipExpiresAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStudentForWa({
                                id: st.id,
                                name: `${st.firstName} ${st.lastName}`,
                                phone: st.phone ?? null,
                                planName: st.currentPlanName,
                                status: statusInfo.status === 'POR_VENCER' || statusInfo.status === 'AL_DIA' ? 'POR_VENCER' : 'VENCIDA',
                                expiresAt: st.membershipExpiresAt,
                              })
                            }
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all duration-150 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                            title="Enviar mensaje por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/alumnos/${st.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all duration-150 shadow-sm hover:scale-105 active:scale-95"
                            title="Ver ficha / Cobrar cuota"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pagos Recientes */}
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-100">
                Últimos Cobros Registrados
              </h2>
              <Link
                href="/finanzas"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Ver caja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                No se registraron cobros recientes.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentPayments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {p.studentName}
                      </div>
                      <div className="text-xs text-zinc-400">
                        Recibo #{p.receiptNumber} • {p.planName} • {p.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        +{formatCurrency(p.amount)}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {formatDate(p.paidAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Alertas de Stock Bajo (1 col) */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-zinc-100">
                  Stock Crítico
                </h2>
              </div>
              <Link
                href="/inventario"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Inventario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                Todos los productos cuentan con stock por encima del nivel mínimo.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-sm font-medium text-zinc-200 truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-zinc-400">SKU: {p.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-900/60">
                        {p.stock} un.
                      </span>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        Mínimo: {p.minStock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Accesos de Navegación Rápida */}
          <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-emerald-900/30">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              Módulos del Gimnasio
            </h3>
            <div className="space-y-2">
              <Link
                href="/ventas"
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 transition-colors"
              >
                <span>Nueva Venta de Mostrador</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/rutinas"
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 transition-colors"
              >
                <span>Planes de Entrenamiento</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </Link>
              <Link
                href="/usuarios"
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 transition-colors"
              >
                <span>Administrar Profesores y Accesos</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Bandeja Diaria */}
      <DailyRemindersModal
        isOpen={dailyRemindersOpen}
        onClose={() => setDailyRemindersOpen(false)}
      />

      {/* Modal individual de WhatsApp para enviar rápido desde la fila */}
      {selectedStudentForWa && (
        <WhatsAppModal
          isOpen={Boolean(selectedStudentForWa)}
          onClose={() => setSelectedStudentForWa(null)}
          studentId={selectedStudentForWa.id}
          studentName={selectedStudentForWa.name}
          rawPhone={selectedStudentForWa.phone}
          planName={selectedStudentForWa.planName}
          reminderType={selectedStudentForWa.status}
          defaultMessage={
            selectedStudentForWa.status === 'VENCIDA'
              ? `Hola ${selectedStudentForWa.name}, te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${selectedStudentForWa.planName || 'Membresía'} venció el ${formatDate(selectedStudentForWa.expiresAt)}. Podés acercarte a recepción o transferir para regularizarla.`
              : `¡Hola ${selectedStudentForWa.name}! Te recordamos desde Centro de Entrenamiento Feltrin que tu cuota de ${selectedStudentForWa.planName || 'Membresía'} vence el ${formatDate(selectedStudentForWa.expiresAt)}. ¡Te esperamos para renovar!`
          }
          membershipExpiresAtSnapshot={selectedStudentForWa.expiresAt}
        />
      )}
    </div>
  );
}
