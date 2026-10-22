'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { membershipPlans } from '@/db/schema';
import { requireRole } from '@/utils/session';
import type { ActionResult, ActionState } from '@/types';

export async function createPlanAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('ADMIN');

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const price = parseFloat(String(formData.get('price') || '0'));
  const durationValue = parseInt(String(formData.get('durationValue') || '1'), 10);
  const durationUnit = String(formData.get('durationUnit') || 'MES') as 'DIA' | 'MES';
  const sessionsRaw = String(formData.get('sessionsPerWeek') || '').trim();
  const sessionsPerWeek = sessionsRaw ? parseInt(sessionsRaw, 10) : null;

  if (!name || isNaN(price) || price < 0 || isNaN(durationValue) || durationValue <= 0) {
    return {
      status: 'error',
      message: 'Revisá los datos ingresados. El nombre, precio y duración son requeridos.',
    };
  }

  try {
    await db.insert(membershipPlans).values({
      name,
      description,
      price,
      durationValue,
      durationUnit,
      sessionsPerWeek,
      isActive: true,
    });

    revalidatePath('/planes');
    revalidatePath('/alumnos');
    return { status: 'success', message: 'Plan comercial creado exitosamente.' };
  } catch (error) {
    console.error('Error createPlanAction:', error);
    return { status: 'error', message: 'No se pudo crear el plan. Verificá que el nombre no esté duplicado.' };
  }
}

export async function updatePlanAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('ADMIN');

  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const price = parseFloat(String(formData.get('price') || '0'));
  const durationValue = parseInt(String(formData.get('durationValue') || '1'), 10);
  const durationUnit = String(formData.get('durationUnit') || 'MES') as 'DIA' | 'MES';
  const sessionsRaw = String(formData.get('sessionsPerWeek') || '').trim();
  const sessionsPerWeek = sessionsRaw ? parseInt(sessionsRaw, 10) : null;

  if (!id || !name || isNaN(price) || price < 0) {
    return { status: 'error', message: 'Datos incompletos para actualizar el plan.' };
  }

  try {
    await db
      .update(membershipPlans)
      .set({
        name,
        description,
        price,
        durationValue,
        durationUnit,
        sessionsPerWeek,
      })
      .where(eq(membershipPlans.id, id));

    revalidatePath('/planes');
    return { status: 'success', message: 'Plan actualizado correctamente.' };
  } catch (error) {
    console.error('Error updatePlanAction:', error);
    return { status: 'error', message: 'Error al actualizar el plan comercial.' };
  }
}

export async function togglePlanStatusAction(id: string, currentActive: boolean): Promise<ActionResult> {
  await requireRole('ADMIN');

  try {
    await db
      .update(membershipPlans)
      .set({ isActive: !currentActive })
      .where(eq(membershipPlans.id, id));

    revalidatePath('/planes');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error togglePlanStatusAction:', error);
    return { ok: false, error: 'No se pudo cambiar el estado del plan.' };
  }
}
