'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { exercises, type MuscleGroup } from '@/db/schema';
import { requireRole } from '@/utils/session';
import type { ActionResult, ActionState } from '@/types';

export async function createExerciseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  const name = String(formData.get('name') || '').trim();
  const muscleGroup = String(formData.get('muscleGroup') || '') as MuscleGroup;
  const equipment = String(formData.get('equipment') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  const videoUrl = String(formData.get('videoUrl') || '').trim() || null;

  if (!name || !muscleGroup) {
    return { status: 'error', message: 'El nombre y el grupo muscular son obligatorios.' };
  }

  try {
    await db.insert(exercises).values({
      name,
      muscleGroup,
      equipment,
      description,
      videoUrl,
      createdById: session.id,
      isActive: true,
    });

    revalidatePath('/ejercicios');
    revalidatePath('/rutinas');
    return { status: 'success', message: 'Ejercicio agregado a la biblioteca.' };
  } catch (error) {
    console.error('Error createExerciseAction:', error);
    return { status: 'error', message: 'No se pudo guardar. El ejercicio ya podría existir.' };
  }
}

export async function updateExerciseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(['ADMIN', 'PROFESOR']);

  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const muscleGroup = String(formData.get('muscleGroup') || '') as MuscleGroup;
  const equipment = String(formData.get('equipment') || '').trim() || null;
  const description = String(formData.get('description') || '').trim() || null;
  const videoUrl = String(formData.get('videoUrl') || '').trim() || null;

  if (!id || !name || !muscleGroup) {
    return { status: 'error', message: 'Datos incompletos para actualizar el ejercicio.' };
  }

  try {
    await db
      .update(exercises)
      .set({
        name,
        muscleGroup,
        equipment,
        description,
        videoUrl,
      })
      .where(eq(exercises.id, id));

    revalidatePath('/ejercicios');
    return { status: 'success', message: 'Ejercicio actualizado correctamente.' };
  } catch (error) {
    console.error('Error updateExerciseAction:', error);
    return { status: 'error', message: 'Error al actualizar el ejercicio.' };
  }
}

export async function toggleExerciseStatusAction(
  id: string,
  currentActive: boolean,
): Promise<ActionResult> {
  await requireRole(['ADMIN', 'PROFESOR']);

  try {
    await db
      .update(exercises)
      .set({ isActive: !currentActive })
      .where(eq(exercises.id, id));

    revalidatePath('/ejercicios');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error toggleExerciseStatusAction:', error);
    return { ok: false, error: 'No se pudo actualizar el estado del ejercicio.' };
  }
}
