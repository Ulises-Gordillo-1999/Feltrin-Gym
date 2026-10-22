'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { gymSettings } from '@/db/schema';
import { requireRole } from '@/utils/session';
import type { ActionState } from '@/types';

export async function updateGymSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('ADMIN');

  const gymName = String(formData.get('gymName') || '').trim();
  const legalName = String(formData.get('legalName') || '').trim() || null;
  const taxId = String(formData.get('taxId') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const email = String(formData.get('email') || '').trim() || null;
  const gracePeriodDays = Math.max(0, parseInt(String(formData.get('gracePeriodDays') || '3'), 10));
  const expiryWarningDays = Math.max(0, parseInt(String(formData.get('expiryWarningDays') || '5'), 10));
  const receiptFooter = String(formData.get('receiptFooter') || '').trim() || null;
  const waTemplateExpiring = String(formData.get('waTemplateExpiring') || '').trim();
  const waTemplateExpired = String(formData.get('waTemplateExpired') || '').trim();
  const waTemplateReceipt = String(formData.get('waTemplateReceipt') || '').trim();

  if (!gymName) {
    return { status: 'error', message: 'El nombre del gimnasio es obligatorio.' };
  }

  try {
    await db
      .update(gymSettings)
      .set({
        gymName,
        legalName,
        taxId,
        address,
        phone,
        email,
        gracePeriodDays,
        expiryWarningDays,
        receiptFooter,
        ...(waTemplateExpiring ? { waTemplateExpiring } : {}),
        ...(waTemplateExpired ? { waTemplateExpired } : {}),
        ...(waTemplateReceipt ? { waTemplateReceipt } : {}),
      })
      .where(eq(gymSettings.id, 1));

    revalidatePath('/configuracion');
    revalidatePath('/dashboard');
    return { status: 'success', message: 'Configuración actualizada exitosamente.' };
  } catch (error) {
    console.error('Error updateGymSettingsAction:', error);
    return { status: 'error', message: 'No se pudo guardar la configuración.' };
  }
}
