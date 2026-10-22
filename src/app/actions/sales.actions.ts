'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  sales,
  saleItems,
  products,
  stockMovements,
  financialTransactions,
  financeCategories,
  type PaymentMethod,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import type { ActionResult, ActionState } from '@/types';

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export async function registerSaleAction(
  studentId: string | null,
  customerName: string | null,
  paymentMethod: PaymentMethod,
  items: CartItemInput[],
  notes?: string | null,
): Promise<ActionResult<{ saleNumber: number }>> {
  const session = await requireRole('ADMIN');

  if (!items || items.length === 0) {
    return { ok: false, error: 'El carrito de venta está vacío.' };
  }

  try {
    let generatedSaleNumber = 0;

    await db.transaction(async (tx) => {
      // 1. Validar productos y stock
      const productIds = items.map((i) => i.productId);
      const dbProducts = await tx.query.products.findMany({
        where: (p, { inArray }) => inArray(p.id, productIds),
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));
      let calculatedTotal = 0;

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod || !prod.isActive) {
          throw new Error(`El producto no existe o está inactivo.`);
        }
        if (prod.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}`);
        }
        calculatedTotal += prod.salePrice * item.quantity;
      }

      // 2. Insertar cabecera de venta
      const [sale] = await tx
        .insert(sales)
        .values({
          studentId: studentId || null,
          customerName: customerName?.trim() || null,
          total: calculatedTotal,
          paymentMethod,
          soldById: session.id,
          notes: notes || null,
          status: 'COMPLETADO',
        })
        .returning();

      generatedSaleNumber = sale.saleNumber;

      // 3. Insertar items, descontar stock y generar movimientos de inventario
      for (const item of items) {
        const prod = productMap.get(item.productId)!;
        const subtotal = prod.salePrice * item.quantity;
        const newStock = prod.stock - item.quantity;

        // Item de venta
        await tx.insert(saleItems).values({
          saleId: sale.id,
          productId: prod.id,
          productNameSnapshot: prod.name,
          quantity: item.quantity,
          unitPrice: prod.salePrice,
          subtotal,
        });

        // Actualizar stock
        await tx
          .update(products)
          .set({ stock: newStock })
          .where(eq(products.id, prod.id));

        // Registro de movimiento
        await tx.insert(stockMovements).values({
          productId: prod.id,
          type: 'VENTA',
          quantity: -item.quantity,
          stockAfter: newStock,
          unitCost: prod.costPrice,
          saleId: sale.id,
          reason: `Venta N° ${sale.saleNumber}`,
          createdById: session.id,
        });
      }

      // 4. Registrar en caja (categoría VENTAS)
      const ventasCat = await tx.query.financeCategories.findFirst({
        where: eq(financeCategories.systemKey, 'VENTAS'),
      });

      if (ventasCat && calculatedTotal > 0) {
        await tx.insert(financialTransactions).values({
          type: 'INGRESO',
          categoryId: ventasCat.id,
          amount: calculatedTotal,
          paymentMethod,
          description: `Venta N° ${sale.saleNumber} - Mostrador`,
          saleId: sale.id,
          registeredById: session.id,
          status: 'COMPLETADO',
        });
      }
    });

    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    return { ok: true, data: { saleNumber: generatedSaleNumber } };
  } catch (error: unknown) {
    console.error('Error registerSaleAction:', error);
    const msg = error instanceof Error ? error.message : 'Error al registrar la venta.';
    return { ok: false, error: msg };
  }
}

export async function voidSaleAction(saleId: string, voidReason: string): Promise<ActionResult> {
  const session = await requireRole('ADMIN');

  if (!voidReason || voidReason.trim().length < 3) {
    return { ok: false, error: 'Ingresá un motivo válido para anular la venta.' };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Obtener la venta y sus items
      const sale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
        with: { items: true },
      });

      if (!sale || sale.status === 'ANULADO') {
        throw new Error('Venta inexistente o ya anulada.');
      }

      // 2. Marcar venta como ANULADA
      await tx
        .update(sales)
        .set({
          status: 'ANULADO',
          voidedAt: new Date(),
          voidReason: voidReason.trim(),
        })
        .where(eq(sales.id, saleId));

      // 3. Restaurar stock de cada producto vendido
      for (const item of sale.items) {
        const prod = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          await tx
            .update(products)
            .set({ stock: restoredStock })
            .where(eq(products.id, prod.id));

          await tx.insert(stockMovements).values({
            productId: prod.id,
            type: 'ANULACION_VENTA',
            quantity: item.quantity,
            stockAfter: restoredStock,
            saleId: sale.id,
            reason: `Restitución por anulación de Venta N° ${sale.saleNumber}`,
            createdById: session.id,
          });
        }
      }

      // 4. Anular movimiento de caja
      await tx
        .update(financialTransactions)
        .set({
          status: 'ANULADO',
          voidedAt: new Date(),
          voidReason: `Anulación de venta: ${voidReason.trim()}`,
        })
        .where(eq(financialTransactions.saleId, saleId));
    });

    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    return { ok: true, data: undefined };
  } catch (error: unknown) {
    console.error('Error voidSaleAction:', error);
    const msg = error instanceof Error ? error.message : 'Error al anular la venta.';
    return { ok: false, error: msg };
  }
}
