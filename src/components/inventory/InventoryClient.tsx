'use client';

import React, { useState, useMemo, useActionState, useEffect, useTransition } from 'react';
import {
  Package,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchBar } from '@/components/ui/SearchBar';
import { createProductAction, adjustStockAction } from '@/app/actions/inventory.actions';
import { IDLE } from '@/types';
import { formatCurrency } from '@/utils/format';
import type { StockMovementType } from '@/db/schema';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryName: string;
  categoryId: string | null;
  imageUrl: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
}

export function InventoryClient({
  products,
  categories,
}: {
  products: ProductItem[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Modal ajuste de stock
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<StockMovementType>('COMPRA');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustPending, startAdjustTransition] = useTransition();

  const [createState, formCreateAction, isCreatePending] = useActionState(
    createProductAction,
    IDLE,
  );

  useEffect(() => {
    if (createState.status === 'success') {
      setIsCreateModalOpen(false);
    }
  }, [createState.status]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'ALL' || p.categoryId === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, search, categoryFilter]);

  const handleAdjustStock = () => {
    if (!adjustingProduct) return;
    const delta = adjustType === 'AJUSTE' && adjustQty < 0 ? adjustQty : adjustType === 'COMPRA' || adjustType === 'DEVOLUCION' ? Math.abs(adjustQty) : -Math.abs(adjustQty);

    startAdjustTransition(async () => {
      const res = await adjustStockAction(
        adjustingProduct.id,
        delta,
        adjustType,
        adjustReason || 'Ajuste de inventario',
      );
      if (res.ok) {
        setAdjustingProduct(null);
        setAdjustQty(1);
        setAdjustReason('');
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Control de Inventario y Stock
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Suplementos, indumentaria y artículos disponibles para venta en mostrador.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          Nuevo Artículo
        </Button>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, SKU o categoría..."
        />

        <div className="flex items-center gap-2">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48 text-xs"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <Card className="p-0 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            No se encontraron artículos en el inventario.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Artículo / SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">Costo</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-100 block">{p.name}</span>
                            <span className="font-mono text-xs text-zinc-400">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-zinc-300">
                        {p.categoryName}
                      </td>

                      <td className="py-3 px-4 text-right text-xs text-zinc-400 font-mono">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-right text-sm font-bold text-emerald-400 font-mono">
                        {formatCurrency(p.salePrice)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={isLow ? 'rose' : 'emerald'} size="sm" dot>
                          {p.stock} un.
                        </Badge>
                        {isLow && (
                          <div className="text-[10px] text-rose-400 mt-0.5">
                            Mínimo: {p.minStock}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingProduct(p)}
                          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                        >
                          Ajustar Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Desacoplado: Alta de Producto */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cargar Nuevo Producto"
        description="Ingresá los datos del artículo para sumarlo al stock del gimnasio."
        maxWidth="lg"
      >
        <form action={formCreateAction} className="space-y-4">
          {createState.status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {createState.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Código SKU" name="sku" placeholder="Ej. PROT-WHEY-1KG" required />
            <Select label="Categoría" name="categoryId" required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <Input label="Nombre del Producto" name="name" placeholder="Ej. Proteína Whey 1kg Vainilla" required />

          <Input label="Descripción (Opcional)" name="description" placeholder="Detalles de marca, presentación, etc." />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio de Costo (ARS)" name="costPrice" type="number" step="100" placeholder="25000" />
            <Input label="Precio de Venta (ARS)" name="salePrice" type="number" step="100" placeholder="38000" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock Inicial" name="initialStock" type="number" min="0" defaultValue="10" required />
            <Input label="Stock Mínimo de Alerta" name="minStock" type="number" min="0" defaultValue="3" required />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Foto del Producto (WebP)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatePending}>
              Guardar en Inventario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Desacoplado: Ajustar Stock */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Ajustar Stock • ${adjustingProduct?.name}`}
        description={`Stock actual registrado: ${adjustingProduct?.stock} unidades.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Movimiento"
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
          >
            <option value="COMPRA">Ingreso por Compra (+)</option>
            <option value="AJUSTE">Ajuste de Inventario (+ / -)</option>
            <option value="DEVOLUCION">Devolución de Cliente (+)</option>
          </Select>

          <Input
            label="Cantidad de Unidades"
            type="number"
            min="1"
            value={adjustQty}
            onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
            required
          />

          <Input
            label="Motivo / Comprobante"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Ej. Factura proveedor N° 4587..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setAdjustingProduct(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAdjustStock}
              isLoading={isAdjustPending}
            >
              Aplicar Ajuste
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
