'use client';

import React, { useState, useMemo, useActionState, useEffect, useTransition } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertOctagon,
  Image as ImageIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  registerTransactionAction,
  voidTransactionAction,
  createFinanceCategoryAction,
} from '@/app/actions/finance.actions';
import { IDLE } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { TransactionType } from '@/db/schema';

export interface TransactionItem {
  id: string;
  type: TransactionType;
  categoryName: string;
  amount: number;
  paymentMethod: string;
  description: string;
  occurredAt: Date;
  status: 'COMPLETADO' | 'ANULADO';
  receiptImageUrl: string | null;
  registeredByName: string;
  isAutomatic: boolean;
}

export interface FinanceClientProps {
  transactions: TransactionItem[];
  categories: Array<{ id: string; name: string; type: TransactionType }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
  };
}

export function FinanceClient({
  transactions,
  categories,
  summary,
}: FinanceClientProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('EGRESO');

  // Modal para agregar categoría
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('EGRESO');
  const [isCatPending, startCatTransition] = useTransition();

  // Dialog anulación
  const [voidTxId, setVoidTxId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidPending, startVoidTransition] = useTransition();

  const [createState, formAction, isPending] = useActionState(
    registerTransactionAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsModalOpen(false);
    }
  }, [createState.status]);

  const filteredCategories = categories.filter((c) => c.type === modalType);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesType = filterType === 'ALL' || t.type === filterType;
      const matchesSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, search]);

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    startCatTransition(async () => {
      const res = await createFinanceCategoryAction(newCatName, newCatType);
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setNewCatName('');
      } else {
        alert(res.error);
      }
    });
  };

  const handleConfirmVoid = () => {
    if (!voidTxId) return;
    startVoidTransition(async () => {
      const res = await voidTransactionAction(voidTxId, voidReason || 'Movimiento anulado');
      if (res.ok) {
        setVoidTxId(null);
        setVoidReason('');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Libro de Caja y Finanzas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ingresos por cuotas y ventas, registro de gastos operativos y balance contable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Nueva Categoría
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setModalType('EGRESO');
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Registrar Gasto / Egreso
          </Button>
        </div>
      </div>

      {/* KPI Cards del Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Ingresos
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              +{formatCurrency(summary.totalIncome)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Cobros de cuotas y ventas</p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Egresos / Gastos
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              -{formatCurrency(summary.totalExpenses)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Alquileres, sueldos, servicios</p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Saldo Neto de Caja
            </span>
            <div
              className={`p-2 rounded-xl border ${
                summary.netBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                summary.netBalance >= 0 ? 'text-zinc-100' : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Disponible en caja</p>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar movimiento por concepto o categoría..."
        />

        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('INGRESO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'INGRESO'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ingresos
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EGRESO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterType === 'EGRESO'
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Egresos
          </button>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <Card className="p-0 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            No se encontraron movimientos registrados con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Concepto / Descripción</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Comprobante</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INGRESO';
                  const isVoid = tx.status === 'ANULADO';
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isVoid ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-xs text-zinc-300 font-mono">
                        {formatDateTime(tx.occurredAt)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={isIncome ? 'emerald' : 'rose'} size="sm">
                          {isIncome ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-zinc-200">
                        {tx.categoryName}
                      </td>

                      <td className="py-3 px-4 text-zinc-300 text-xs">
                        <div className="font-medium text-zinc-100">{tx.description}</div>
                        <div className="text-[11px] text-zinc-500">Por: {tx.registeredByName}</div>
                      </td>

                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-bold text-sm ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {tx.receiptImageUrl ? (
                          <a
                            href={tx.receiptImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                            title="Ver comprobante adjunto"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Foto</span>
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isVoid && !tx.isAutomatic && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoidTxId(tx.id);
                              setVoidReason('');
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Anular movimiento"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                        )}
                        {tx.isAutomatic && (
                          <span className="text-[10px] text-zinc-500 italic">
                            Auto (Cuota/Venta)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Desacoplado: Registrar Movimiento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Movimiento de Caja"
        description="Ingresá los datos del egreso o ingreso manual del gimnasio."
        maxWidth="md"
      >
        <form action={formAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setModalType('EGRESO')}
              className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                modalType === 'EGRESO'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              Gasto / Egreso (-)
            </button>
            <button
              type="button"
              onClick={() => setModalType('INGRESO')}
              className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                modalType === 'INGRESO'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              Ingreso Extra (+)
            </button>
          </div>
          <input type="hidden" name="type" value={modalType} />

          <Select label="Categoría" name="categoryId" required>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monto (ARS)"
              name="amount"
              type="number"
              step="100"
              placeholder="15000"
              required
            />
            <Select label="Método de Pago" name="paymentMethod" required>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
              <option value="DEBITO">Débito</option>
              <option value="CREDITO">Crédito</option>
            </Select>
          </div>

          <Input
            label="Concepto / Detalle"
            name="description"
            placeholder="Ej. Pago de factura de luz Edenor..."
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Foto del Comprobante (Opcional - WebP)
            </label>
            <input
              type="file"
              name="receiptImage"
              accept="image/*"
              className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Registrar Movimiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Nueva Categoría */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Crear Nueva Categoría Contable"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Categoría"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Ej. Seguro de Responsabilidad Civil"
            required
          />

          <Select
            label="Tipo de Categoría"
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as TransactionType)}
          >
            <option value="EGRESO">Egreso (Gasto)</option>
            <option value="INGRESO">Ingreso</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateCategory}
              isLoading={isCatPending}
            >
              Guardar Categoría
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog: Anular Movimiento */}
      <ConfirmDialog
        isOpen={!!voidTxId}
        onClose={() => setVoidTxId(null)}
        onConfirm={handleConfirmVoid}
        title="¿Anular este Movimiento de Caja?"
        message="El registro quedará marcado como ANULADO y su impacto se descontará del balance neto de la caja. No se puede revertir."
        confirmText="Anular Movimiento"
        variant="danger"
        isLoading={isVoidPending}
      />
    </div>
  );
}
