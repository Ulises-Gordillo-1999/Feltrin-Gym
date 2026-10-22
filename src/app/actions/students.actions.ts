'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { students, users, type StudentStatus } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { hashPassword } from '@/utils/session';
import { saveOptimizedWebP, deleteUploadedImage } from '@/utils/images';
import type { ActionResult, ActionState } from '@/types';

export async function createStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const dni = String(formData.get('dni') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const birthDate = String(formData.get('birthDate') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const emergencyContactName = String(formData.get('emergencyContactName') || '').trim() || null;
  const emergencyContactPhone = String(formData.get('emergencyContactPhone') || '').trim() || null;
  const medicalNotes = String(formData.get('medicalNotes') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;
  const currentPlanId = String(formData.get('currentPlanId') || '').trim() || null;
  const assignedTrainerId = String(formData.get('assignedTrainerId') || '').trim() || null;

  // Opción de crear cuenta de usuario para que el alumno ingrese al sistema
  const createUserAccount = formData.get('createUserAccount') === 'true';
  const temporaryPassword = String(formData.get('temporaryPassword') || '').trim();

  if (!firstName || !lastName || !dni) {
    return {
      status: 'error',
      message: 'Nombre, apellido y DNI son obligatorios.',
      fieldErrors: {
        firstName: !firstName ? 'Requerido' : undefined,
        lastName: !lastName ? 'Requerido' : undefined,
        dni: !dni ? 'Requerido' : undefined,
      },
    };
  }

  // Foto opcional
  let photoUrl: string | null = null;
  const photoFile = formData.get('photo') as File | null;
  if (photoFile && photoFile.size > 0 && photoFile.type.startsWith('image/')) {
    try {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await saveOptimizedWebP(buffer, 'avatars', { maxWidth: 800, quality: 80 });
    } catch (e) {
      console.error('Error procesando foto de alumno:', e);
    }
  }

  try {
    let createdUserId: string | null = null;

    if (createUserAccount && email && temporaryPassword) {
      const existingUser = await db.query.users.findFirst({
        where: eq(sql`lower(${users.email})`, email),
      });

      if (existingUser) {
        return {
          status: 'error',
          message: 'Ya existe un usuario con este correo electrónico en el sistema.',
        };
      }

      const pHash = await hashPassword(temporaryPassword);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          fullName: `${firstName} ${lastName}`,
          passwordHash: pHash,
          role: 'ALUMNO',
          avatarUrl: photoUrl,
        })
        .returning();
      createdUserId = newUser.id;
    }

    await db.insert(students).values({
      firstName,
      lastName,
      dni,
      email,
      phone,
      birthDate,
      address,
      emergencyContactName,
      emergencyContactPhone,
      medicalNotes,
      notes,
      photoUrl,
      userId: createdUserId,
      currentPlanId: currentPlanId || null,
      assignedTrainerId: assignedTrainerId || session.id,
      status: 'ACTIVO',
    });

    revalidatePath('/alumnos');
    revalidatePath('/dashboard');
    return { status: 'success', message: 'Alumno registrado exitosamente.' };
  } catch (error) {
    console.error('Error en createStudentAction:', error);
    return {
      status: 'error',
      message: 'No se pudo registrar al alumno. Verificá que el DNI no esté duplicado.',
    };
  }
}

export async function updateStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(['ADMIN', 'PROFESOR']);

  const id = String(formData.get('id') || '');
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const dni = String(formData.get('dni') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase() || null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const birthDate = String(formData.get('birthDate') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  const emergencyContactName = String(formData.get('emergencyContactName') || '').trim() || null;
  const emergencyContactPhone = String(formData.get('emergencyContactPhone') || '').trim() || null;
  const medicalNotes = String(formData.get('medicalNotes') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;
  const currentPlanId = String(formData.get('currentPlanId') || '').trim() || null;
  const assignedTrainerId = String(formData.get('assignedTrainerId') || '').trim() || null;
  const status = String(formData.get('status') || 'ACTIVO') as StudentStatus;

  if (!id || !firstName || !lastName || !dni) {
    return { status: 'error', message: 'Datos incompletos para actualizar al alumno.' };
  }

  // Foto nueva opcional
  const photoFile = formData.get('photo') as File | null;
  let newPhotoUrl: string | undefined = undefined;

  if (photoFile && photoFile.size > 0 && photoFile.type.startsWith('image/')) {
    try {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      newPhotoUrl = await saveOptimizedWebP(buffer, 'avatars', { maxWidth: 800, quality: 80 });
    } catch (e) {
      console.error('Error procesando nueva foto:', e);
    }
  }

  try {
    const existing = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (newPhotoUrl && existing?.photoUrl) {
      await deleteUploadedImage(existing.photoUrl);
    }

    await db
      .update(students)
      .set({
        firstName,
        lastName,
        dni,
        email,
        phone,
        birthDate,
        address,
        emergencyContactName,
        emergencyContactPhone,
        medicalNotes,
        notes,
        status,
        currentPlanId: currentPlanId || null,
        assignedTrainerId: assignedTrainerId || null,
        ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      })
      .where(eq(students.id, id));

    revalidatePath(`/alumnos/${id}`);
    revalidatePath('/alumnos');
    return { status: 'success', message: 'Datos del alumno actualizados correctamente.' };
  } catch (error) {
    console.error('Error en updateStudentAction:', error);
    return { status: 'error', message: 'Error al actualizar los datos del alumno.' };
  }
}

export async function toggleStudentStatusAction(
  id: string,
  newStatus: StudentStatus,
): Promise<ActionResult> {
  await requireRole(['ADMIN', 'PROFESOR']);

  try {
    await db.update(students).set({ status: newStatus }).where(eq(students.id, id));
    revalidatePath('/alumnos');
    revalidatePath(`/alumnos/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error toggleStudentStatusAction:', error);
    return { ok: false, error: 'No se pudo actualizar el estado del alumno.' };
  }
}
