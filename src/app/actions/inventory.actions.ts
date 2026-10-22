'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { products, stockMovements, productCategories, type StockMovementType } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { saveOptimizedWebP } from '@/utils/images';
import type { ActionResult, ActionState } from '@/types';

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole('ADMIN');

  const sku = String(formData.get('sku') || '').trim().toUpperCase();
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const categoryId = String(formData.get('categoryId') || '') || null;
  const costPrice = Math.max(0, parseFloat(String(formData.get('costPrice') || '0')));
  const salePrice = parseFloat(String(formData.get('salePrice') || '0'));
  const initialStock = Math.max(0, parseInt(String(formData.get('initialStock') || '0'), 10));
  const minStock = Math.max(0, parseInt(String(formData.get('minStock') || '0'), 10));

  if (!sku || !name || isNaN(salePrice) || salePrice < 0) {
    return { status: 'error', message: 'El SKU, nombre y precio de venta son obligatorios.' };
  }

  // Foto opcional WebP
  let imageUrl: string | null = null;
  const imageFile = formData.get('image') as File | null;
  if (imageFile && imageFile.size > 0 && imageFile.type.startsWith('image/')) {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await saveOptimizedWebP(buffer, 'products', { maxWidth: 800, quality: 80 });
    } catch (e) {
      console.error('Error procesando imagen del artículo:', e);
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          sku,
          name,
          description,
          categoryId,
          costPrice,
          salePrice,
          stock: initialStock,
          minStock,
          imageUrl,
          isActive: true,
        })
        .returning();

      if (initialStock > 0) {
        await tx.insert(stockMovements).values({
          productId: product.id,
          type: 'COMPRA',
          quantity: initialStock,
          stockAfter: initialStock,
          unitCost: costPrice,
          reason: 'Carga de stock inicial',
          createdById: session.id,
        });
      }
    });

    revalidatePath('/inventario');
    return { status: 'success', message: 'Artículo agregado al inventario.' };
  } catch (error) {
    console.error('Error createProductAction:', error);
    return { status: 'error', message: 'No se pudo guardar el producto. Verificá que el SKU no esté duplicado.' };
  }
}

export async function adjustStockAction(
  productId: string,
  quantityDelta: number,
  type: StockMovementType,
  reason: string,
): Promise<ActionResult> {
  const session = await requireRole('ADMIN');

  if (quantityDelta === 0) {
    return { ok: false, error: 'La cantidad a modificar debe ser distinta de 0.' };
  }

  try {
    await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) throw new Error('Producto no encontrado');

      const newStock = product.stock + quantityDelta;
      if (newStock < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${product.stock}`);
      }

      await tx
        .update(products)
        .set({ stock: newStock })
        .where(eq(products.id, productId));

      await tx.insert(stockMovements).values({
        productId,
        type,
        quantity: quantityDelta,
        stockAfter: newStock,
        reason: reason.trim() || 'Ajuste manual de stock',
        createdById: session.id,
      });
    });

    revalidatePath('/inventario');
    return { ok: true, data: undefined };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al ajustar stock';
    return { ok: false, error: msg };
  }
}
