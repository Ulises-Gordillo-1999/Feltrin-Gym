'use client';

import React, { useState, useMemo, useActionState, useEffect, useTransition } from 'react';
import {
  Package,
  Plus,
  ArrowUpDown,
  Pencil,
  Trash2,
  FolderPlus,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchBar } from '@/components/ui/SearchBar';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  adjustStockAction,
  createCategoryAction,
} from '@/app/actions/inventory.actions';
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
  categories: initialCategories,
}: {
  products: ProductItem[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sincronizar categorías si cambian desde el servidor
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Modal ajuste de stock
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<StockMovementType>('COMPRA');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isAdjustPending, startAdjustTransition] = useTransition();

  // Modal edición de producto
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [updateState, formUpdateAction, isUpdatePending] = useActionState(
    updateProductAction,
    IDLE,
  );

  useEffect(() => {
    if (updateState.status === 'success') {
      setEditingProduct(null);
    }
  }, [updateState.status]);

  // Modal eliminación con doble confirmación
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();

  // Modal creación de nueva categoría
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoryPending, startCategoryTransition] = useTransition();

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
    setAdjustError(null);
    const delta =
      adjustType === 'AJUSTE' && adjustQty < 0
        ? adjustQty
        : adjustType === 'COMPRA' || adjustType === 'DEVOLUCION'
        ? Math.abs(adjustQty)
        : -Math.abs(adjustQty);

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
        setAdjustError(null);
      } else {
        setAdjustError(res.error);
      }
    });
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const res = await deleteProductAction(deletingProduct.id);
      if (res.ok) {
        setDeletingProduct(null);
        setDeleteStep(1);
        setDeleteError(null);
      } else {
        setDeleteError(res.error);
      }
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategoryError(null);

    startCategoryTransition(async () => {
      const res = await createCategoryAction(newCatName.trim(), newCatDesc.trim());
      if (res.ok) {
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === res.data.id);
          if (exists) return prev;
          return [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name));
        });
        setNewCatName('');
        setNewCatDesc('');
        setIsCategoryModalOpen(false);
      } else {
        setCategoryError(res.error);
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

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              setNewCatName('');
              setNewCatDesc('');
              setCategoryError(null);
              setIsCategoryModalOpen(true);
            }}
            icon={<FolderPlus className="w-4 h-4" />}
          >
            Nueva Categoría
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Nuevo Artículo
          </Button>
        </div>
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
                  <th className="py-3 px-4 text-right">Acciones</th>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustError(null);
                              setAdjustingProduct(p);
                            }}
                            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                            title="Ajustar Stock"
                          >
                            <span className="hidden xl:inline">Ajustar</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(p)}
                            icon={<Pencil className="w-3.5 h-3.5 text-zinc-300" />}
                            title="Editar Precios y Datos"
                          >
                            <span className="hidden xl:inline">Editar</span>
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeletingProduct(p);
                              setDeleteStep(1);
                              setDeleteError(null);
                            }}
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-300" />}
                            title="Eliminar Producto"
                          >
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Categoría
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  + Nueva Categoría
                </button>
              </div>
              <Select name="categoryId" required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
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

      {/* Modal Desacoplado: Editar Producto */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Editar Producto • ${editingProduct?.name}`}
        description="Actualizá los precios de costo, venta y datos del artículo."
        maxWidth="lg"
      >
        {editingProduct && (
          <form action={formUpdateAction} className="space-y-4">
            <input type="hidden" name="productId" value={editingProduct.id} />

            {updateState.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
                {updateState.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Código SKU"
                name="sku"
                defaultValue={editingProduct.sku}
                disabled
                helperText="El SKU es el identificador único del producto y no se modifica."
              />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    + Nueva Categoría
                  </button>
                </div>
                <Select name="categoryId" defaultValue={editingProduct.categoryId || ''}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Input
              label="Nombre del Producto"
              name="name"
              defaultValue={editingProduct.name}
              placeholder="Ej. Proteína Whey 1kg Vainilla"
              required
            />

            <Input
              label="Descripción (Opcional)"
              name="description"
              defaultValue={editingProduct.description || ''}
              placeholder="Detalles de marca, presentación, etc."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio de Costo (ARS)"
                name="costPrice"
                type="number"
                step="100"
                defaultValue={editingProduct.costPrice}
              />
              <Input
                label="Precio de Venta (ARS)"
                name="salePrice"
                type="number"
                step="100"
                defaultValue={editingProduct.salePrice}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock Actual (Solo Lectura)"
                value={`${editingProduct.stock} unidades`}
                disabled
                helperText="Para modificar stock usá el botón 'Ajustar'."
              />
              <Input
                label="Stock Mínimo de Alerta"
                name="minStock"
                type="number"
                min="0"
                defaultValue={editingProduct.minStock}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Reemplazar Foto (Opcional WebP)
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatePending}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Desacoplado: Eliminación con Doble Confirmación */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => {
          if (!isDeletePending) {
            setDeletingProduct(null);
            setDeleteStep(1);
            setDeleteError(null);
          }
        }}
        maxWidth="md"
        title={
          deleteStep === 1
            ? '¿Dar de baja artículo del inventario?'
            : 'Paso 2 de 2: Confirmación Definitiva'
        }
      >
        {deletingProduct && (
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            {deleteStep === 1 ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-300">
                      Estás por dar de baja el siguiente artículo:
                    </p>
                    <p className="text-base font-bold text-zinc-100">
                      {deletingProduct.name}
                    </p>
                    <p className="font-mono text-xs text-zinc-400">
                      SKU: {deletingProduct.sku} • Stock actual: {deletingProduct.stock} un.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span>🛡️</span> Protección del historial contable:
                  </p>
                  <p>
                    Si este producto ya cuenta con ventas registradas o movimientos históricos de caja, el sistema lo desactivará del catálogo para que no aparezca en el inventario ni en el punto de venta, preservando la exactitud de tus balances contables anteriores.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeletingProduct(null);
                      setDeleteStep(1);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setDeleteStep(2)}
                  >
                    Continuar a Confirmación Final
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-300">
                      ¿Confirmás la eliminación definitiva?
                    </p>
                    <p className="text-sm text-zinc-300">
                      Esta acción dará de baja de forma irreversible el artículo{' '}
                      <strong className="text-zinc-100">{deletingProduct.name}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDeletePending}
                    onClick={() => setDeleteStep(1)}
                  >
                    Volver Atrás
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    isLoading={isDeletePending}
                    onClick={handleDeleteProduct}
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    Sí, Eliminar Definitivamente
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Desacoplado: Crear Nueva Categoría */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Crear Nueva Categoría"
        description="Agregá una nueva categoría para organizar productos en el inventario y punto de venta."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {categoryError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {categoryError}
            </div>
          )}

          <Input
            label="Nombre de la Categoría"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Ej. Snacks Saludables, Toallas, etc."
            required
            autoFocus
          />

          <Input
            label="Descripción (Opcional)"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="Breve descripción o detalle..."
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              disabled={isCategoryPending}
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCategoryPending}
              icon={<FolderPlus className="w-4 h-4" />}
            >
              Guardar Categoría
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
          {adjustError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs">
              {adjustError}
            </div>
          )}

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
