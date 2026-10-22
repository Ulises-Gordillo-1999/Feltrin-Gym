'use client';

import React, { useState, useTransition } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  User,
  AlertOctagon,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { registerSaleAction, voidSaleAction } from '@/app/actions/sales.actions';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { PaymentMethod } from '@/db/schema';

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  salePrice: number;
  stock: number;
}

export interface SaleHistoryItem {
  id: string;
  saleNumber: number;
  customerName: string;
  total: number;
  paymentMethod: string;
  status: 'COMPLETADO' | 'ANULADO';
  soldAt: Date;
  soldByName: string;
  itemsSummary: string;
}

export interface SalesClientProps {
  products: PosProduct[];
  students: Array<{ id: string; fullName: string }>;
  salesHistory: SaleHistoryItem[];
}

export function SalesClient({
  products,
  students,
  salesHistory,
}: SalesClientProps) {
  const [cart, setCart] = useState<Array<{ product: PosProduct; quantity: number }>>([]);
  const [productSearch, setProductSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [notes, setNotes] = useState('');

  const [isCheckoutPending, startCheckoutTransition] = useTransition();
  const [lastSuccessTicket, setLastSuccessTicket] = useState<number | null>(null);

  // Dialog anulación
  const [voidSaleId, setVoidSaleId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidPending, startVoidTransition] = useTransition();

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())),
  );

  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No hay más stock disponible para ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.product.salePrice * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (cart.length === 0) return;

    startCheckoutTransition(async () => {
      const res = await registerSaleAction(
        studentId || null,
        studentId ? null : customerName || 'Consumidor Final',
        paymentMethod,
        cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes || null,
      );

      if (res.ok) {
        setLastSuccessTicket(res.data.saleNumber);
        setCart([]);
        setStudentId('');
        setCustomerName('');
        setNotes('');
        setTimeout(() => setLastSuccessTicket(null), 6000);
      } else {
        alert(res.error);
      }
    });
  };

  const handleConfirmVoid = () => {
    if (!voidSaleId) return;
    startVoidTransition(async () => {
      const res = await voidSaleAction(voidSaleId, voidReason || 'Venta anulada');
      if (res.ok) {
        setVoidSaleId(null);
        setVoidReason('');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Punto de Venta de Mostrador
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Venta de suplementos, indumentaria y bebidas con descuento automático de stock y registro en caja.
        </p>
      </div>

      {lastSuccessTicket && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">
              ¡Venta #{lastSuccessTicket} registrada con éxito! El stock se descontó y el dinero ingresó a la caja.
            </span>
          </div>
        </div>
      )}

      {/* Grid Principal: Catálogo de Productos a la Izquierda + Carrito a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de Productos (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto para agregar al carrito..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </span>
                    <Badge variant="zinc" size="sm">
                      {p.categoryName}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500 mt-1 block">
                    SKU: {p.sku}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400">
                    {formatCurrency(p.salePrice)}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Stock: <strong className="text-zinc-200">{p.stock}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito de Compra (1 col) */}
        <Card className="flex flex-col justify-between h-full bg-zinc-900/80 border-zinc-800">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Carrito de Venta</h2>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Items del Carrito */}
            <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  El carrito está vacío. Hacé clic en un producto para sumarlo.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-200 block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {formatCurrency(item.product.salePrice * item.quantity)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Datos del Cliente y Pago */}
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <Select
                label="Asociar Alumno (Opcional)"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (e.target.value) setCustomerName('');
                }}
              >
                <option value="">Cliente Ocasional / Mostrador</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </Select>

              {!studentId && (
                <Input
                  label="Nombre del Cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                />
              )}

              <Select
                label="Método de Pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
              </Select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-base font-bold">
              <span className="text-zinc-300">Total a Pagar:</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              isLoading={isCheckoutPending}
              icon={<CreditCard className="w-5 h-5" />}
            >
              Completar Venta y Cobrar
            </Button>
          </div>
        </Card>
      </div>

      {/* Historial de Ventas Recientes */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">
            Historial de Ventas Recientes
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro de tickets de mostrador y ventas asociadas a alumnos.
          </p>
        </div>

        {salesHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No se han registrado ventas todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket N°</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Artículos</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {salesHistory.map((s) => {
                  const isVoid = s.status === 'ANULADO';
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isVoid ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-zinc-300">
                        #{String(s.saleNumber).padStart(6, '0')}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {formatDateTime(s.soldAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-200">
                        {s.customerName}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400 max-w-xs truncate">
                        {s.itemsSummary}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {s.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                        {formatCurrency(s.total)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isVoid ? 'rose' : 'emerald'} size="sm" dot>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isVoid && (
                          <button
                            type="button"
                            onClick={() => {
                              setVoidSaleId(s.id);
                              setVoidReason('');
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Anular venta y restaurar stock"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
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

      {/* ConfirmDialog: Anular Venta */}
      <ConfirmDialog
        isOpen={!!voidSaleId}
        onClose={() => setVoidSaleId(null)}
        onConfirm={handleConfirmVoid}
        title="¿Anular Ticket de Venta?"
        message="Esta acción cancelará la venta, repondrá automáticamente el stock de los productos vendidos y anulará el ingreso en la caja. No se puede revertir."
        confirmText="Anular Venta"
        variant="danger"
        isLoading={isVoidPending}
      />
    </div>
  );
}
