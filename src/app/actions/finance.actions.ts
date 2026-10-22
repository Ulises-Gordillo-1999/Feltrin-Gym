'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  financialTransactions,
  financeCategories,
  type TransactionType,
  type PaymentMethod,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import { saveOptimizedWebP } from '@/utils/images';
import type { ActionResult, ActionState } from '@/types';

export async function registerTransactionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole('ADMIN');

  const type = (String(formData.get('type') || 'EGRESO')) as TransactionType;
  const categoryId = String(formData.get('categoryId') || '');
  const amount = parseFloat(String(formData.get('amount') || '0'));
  const paymentMethod = (String(formData.get('paymentMethod') || 'EFECTIVO')) as PaymentMethod;
  const description = String(formData.get('description') || '').trim();

  if (!categoryId || isNaN(amount) || amount <= 0 || !description) {
    return {
      status: 'error',
      message: 'Completá todos los campos requeridos y verificá que el monto sea mayor a 0.',
    };
  }

  // Foto de comprobante opcional (ej. factura de luz, ticket de ferretería)
  let receiptImageUrl: string | null = null;
  const receiptFile = formData.get('receiptImage') as File | null;
  if (receiptFile && receiptFile.size > 0 && receiptFile.type.startsWith('image/')) {
    try {
      const buffer = Buffer.from(await receiptFile.arrayBuffer());
      receiptImageUrl = await saveOptimizedWebP(buffer, 'receipts', { maxWidth: 1200, quality: 80 });
    } catch (e) {
      console.error('Error procesando comprobante de gasto:', e);
    }
  }

  try {
    await db.insert(financialTransactions).values({
      type,
      categoryId,
      amount,
      paymentMethod,
      description,
      receiptImageUrl,
      registeredById: session.id,
      status: 'COMPLETADO',
    });

    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    return { status: 'success', message: `${type === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado con éxito.` };
  } catch (error) {
    console.error('Error registerTransactionAction:', error);
    return { status: 'error', message: 'No se pudo registrar el movimiento de caja.' };
  }
}

export async function voidTransactionAction(
  transactionId: string,
  voidReason: string,
): Promise<ActionResult> {
  await requireRole('ADMIN');

  if (!voidReason || voidReason.trim().length < 3) {
    return { ok: false, error: 'Ingresá un motivo para la anulación.' };
  }

  try {
    const tx = await db.query.financialTransactions.findFirst({
      where: eq(financialTransactions.id, transactionId),
    });

    if (!tx) return { ok: false, error: 'Movimiento no encontrado.' };

    if (tx.membershipPaymentId) {
      return {
        ok: false,
        error:
          'Este movimiento proviene del cobro de una cuota. Anulalo desde el comprobante en la ficha del alumno.',
      };
    }

    if (tx.saleId) {
      return {
        ok: false,
        error:
          'Este movimiento proviene de una venta de mostrador. Anulalo desde el panel de ventas.',
      };
    }

    await db
      .update(financialTransactions)
      .set({
        status: 'ANULADO',
        voidedAt: new Date(),
        voidReason: voidReason.trim(),
      })
      .where(eq(financialTransactions.id, transactionId));

    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error voidTransactionAction:', error);
    return { ok: false, error: 'Error al anular el movimiento de caja.' };
  }
}

export async function createFinanceCategoryAction(
  name: string,
  type: TransactionType,
): Promise<ActionResult> {
  await requireRole('ADMIN');

  if (!name.trim()) {
    return { ok: false, error: 'El nombre de la categoría es obligatorio.' };
  }

  try {
    await db.insert(financeCategories).values({
      name: name.trim(),
      type,
    });

    revalidatePath('/finanzas');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error createFinanceCategoryAction:', error);
    return { ok: false, error: 'La categoría ya existe o no se pudo guardar.' };
  }
}
