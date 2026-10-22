'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  students,
  membershipPlans,
  membershipPayments,
  financialTransactions,
  financeCategories,
  gymSettings,
  type PaymentMethod,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import { calculatePaymentPeriod } from '@/utils/membership';
import type { ActionResult, ActionState } from '@/types';

export async function registerPaymentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  const studentId = String(formData.get('studentId') || '');
  const planId = String(formData.get('planId') || '');
  const paymentMethod = String(formData.get('paymentMethod') || 'EFECTIVO') as PaymentMethod;
  const discount = Math.max(0, parseFloat(String(formData.get('discount') || '0')));
  const notes = String(formData.get('notes') || '').trim() || null;

  if (!studentId || !planId) {
    return { status: 'error', message: 'Seleccioná un alumno y un plan de entrenamiento.' };
  }

  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    });

    const plan = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.id, planId),
    });

    if (!student || !plan) {
      return { status: 'error', message: 'El alumno o el plan seleccionado no existen.' };
    }

    if (discount > plan.price) {
      return { status: 'error', message: 'El descuento no puede superar el precio de lista del plan.' };
    }

    const settings = await db.query.gymSettings.findFirst({
      where: eq(gymSettings.id, 1),
    });
    const gracePeriodDays = settings?.gracePeriodDays ?? 3;

    // Calcular período según reglas de continuidad
    const { periodStart, periodEnd } = calculatePaymentPeriod({
      currentExpiry: student.membershipExpiresAt,
      durationValue: plan.durationValue,
      durationUnit: plan.durationUnit,
      gracePeriodDays,
    });

    const netAmount = plan.price - discount;

    // Ejecutar transacción atómica
    await db.transaction(async (tx) => {
      // 1. Insertar comprobante de pago
      const [payment] = await tx
        .insert(membershipPayments)
        .values({
          studentId: student.id,
          planId: plan.id,
          planNameSnapshot: plan.name,
          listPrice: plan.price,
          discount,
          amount: netAmount,
          periodStart,
          periodEnd,
          paymentMethod,
          notes,
          registeredById: session.id,
          status: 'COMPLETADO',
        })
        .returning();

      // 2. Obtener categoría CUOTAS del sistema
      const cuotasCat = await tx.query.financeCategories.findFirst({
        where: eq(financeCategories.systemKey, 'CUOTAS'),
      });

      if (cuotasCat && netAmount > 0) {
        // 3. Registrar movimiento en la caja del gimnasio
        await tx.insert(financialTransactions).values({
          type: 'INGRESO',
          categoryId: cuotasCat.id,
          amount: netAmount,
          paymentMethod,
          description: `Cuota de ${student.firstName} ${student.lastName} - ${plan.name}`,
          membershipPaymentId: payment.id,
          registeredById: session.id,
          status: 'COMPLETADO',
        });
      }

      // 4. Actualizar estado y vencimiento en la ficha del alumno
      await tx
        .update(students)
        .set({
          membershipExpiresAt: periodEnd,
          lastPaymentAt: new Date(),
          currentPlanId: plan.id,
          status: 'ACTIVO',
        })
        .where(eq(students.id, student.id));
    });

    revalidatePath(`/alumnos/${studentId}`);
    revalidatePath('/alumnos');
    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    revalidatePath('/mis-pagos');

    return {
      status: 'success',
      message: `Pago registrado con éxito. Nuevo vencimiento: ${periodEnd}`,
    };
  } catch (error) {
    console.error('Error registerPaymentAction:', error);
    return { status: 'error', message: 'No se pudo registrar el pago de la cuota.' };
  }
}

export async function voidPaymentAction(
  paymentId: string,
  voidReason: string,
): Promise<ActionResult> {
  const session = await requireRole('ADMIN');

  if (!voidReason || voidReason.trim().length < 3) {
    return { ok: false, error: 'Ingresá un motivo válido para anular el comprobante.' };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Marcar pago como ANULADO
      const [payment] = await tx
        .update(membershipPayments)
        .set({
          status: 'ANULADO',
          voidedAt: new Date(),
          voidedById: session.id,
          voidReason: voidReason.trim(),
        })
        .where(eq(membershipPayments.id, paymentId))
        .returning();

      if (!payment) throw new Error('Pago no encontrado');

      // 2. Anular el movimiento de caja asociado
      await tx
        .update(financialTransactions)
        .set({
          status: 'ANULADO',
          voidedAt: new Date(),
          voidReason: `Anulación de cuota: ${voidReason.trim()}`,
        })
        .where(eq(financialTransactions.membershipPaymentId, paymentId));

      // 3. Recalcular fecha de vencimiento con el último pago vigente
      const remainingPayments = await tx.query.membershipPayments.findMany({
        where: and(
          eq(membershipPayments.studentId, payment.studentId),
          eq(membershipPayments.status, 'COMPLETADO'),
        ),
        orderBy: [desc(membershipPayments.periodEnd)],
        limit: 1,
      });

      const newExpiry = remainingPayments[0]?.periodEnd ?? null;
      const lastPayment = remainingPayments[0]?.paidAt ?? null;

      await tx
        .update(students)
        .set({
          membershipExpiresAt: newExpiry,
          lastPaymentAt: lastPayment,
        })
        .where(eq(students.id, payment.studentId));
    });

    revalidatePath('/alumnos');
    revalidatePath('/finanzas');
    revalidatePath('/dashboard');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error voidPaymentAction:', error);
    return { ok: false, error: 'Ocurrió un error al anular el pago.' };
  }
}
