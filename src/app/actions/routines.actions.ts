'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  routines,
  routineDays,
  routineExercises,
  studentRoutines,
  students,
  type RoutineGoal,
  type RoutineLevel,
  type DayOfWeek,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import { getTodayBusinessDate } from '@/utils/dates';
import type { ActionResult, ActionState } from '@/types';

export async function createRoutineAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const goal = (String(formData.get('goal') || 'GENERAL')) as RoutineGoal;
  const level = (String(formData.get('level') || 'PRINCIPIANTE')) as RoutineLevel;
  const isTemplate = formData.get('isTemplate') !== 'false';

  if (!name) {
    return { status: 'error', message: 'El nombre de la rutina es obligatorio.' };
  }

  try {
    const [newRoutine] = await db
      .insert(routines)
      .values({
        name,
        description,
        goal,
        level,
        isTemplate,
        createdById: session.id,
        isActive: true,
      })
      .returning();

    revalidatePath('/rutinas');
    return {
      status: 'success',
      message: `Rutina creada. ID:${newRoutine.id}`,
    };
  } catch (error) {
    console.error('Error createRoutineAction:', error);
    return { status: 'error', message: 'No se pudo crear la rutina.' };
  }
}

export interface DayExerciseInput {
  exerciseId: string;
  position: number;
  sets: number;
  reps: string;
  load?: string | null;
  restSeconds?: number | null;
  tempo?: string | null;
  notes?: string | null;
}

export async function saveRoutineDayAction(
  routineId: string,
  dayOfWeek: DayOfWeek,
  title: string,
  notes: string | null,
  exerciseItems: DayExerciseInput[],
): Promise<ActionResult> {
  await requireRole(['ADMIN', 'PROFESOR']);

  try {
    await db.transaction(async (tx) => {
      // 1. Obtener o crear el routine_day
      let day = await tx.query.routineDays.findFirst({
        where: and(eq(routineDays.routineId, routineId), eq(routineDays.dayOfWeek, dayOfWeek)),
      });

      if (!day) {
        const [insertedDay] = await tx
          .insert(routineDays)
          .values({
            routineId,
            dayOfWeek,
            title,
            notes,
          })
          .returning();
        day = insertedDay;
      } else {
        await tx
          .update(routineDays)
          .set({ title, notes })
          .where(eq(routineDays.id, day.id));
      }

      // 2. Limpiar ejercicios anteriores del día
      await tx.delete(routineExercises).where(eq(routineExercises.routineDayId, day.id));

      // 3. Insertar nuevos ejercicios
      if (exerciseItems.length > 0) {
        await tx.insert(routineExercises).values(
          exerciseItems.map((ex, idx) => ({
            routineDayId: day.id,
            exerciseId: ex.exerciseId,
            position: idx + 1,
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            load: ex.load || null,
            restSeconds: ex.restSeconds || 60,
            tempo: ex.tempo || null,
            notes: ex.notes || null,
          })),
        );
      }
    });

    revalidatePath(`/rutinas/${routineId}`);
    revalidatePath('/mi-rutina');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error saveRoutineDayAction:', error);
    return { ok: false, error: 'No se pudieron guardar los ejercicios del día.' };
  }
}

export async function assignRoutineToStudentAction(
  routineId: string,
  studentId: string,
  notes?: string,
): Promise<ActionResult> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    });
    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, routineId),
      with: {
        days: {
          with: {
            exercises: true,
          },
        },
      },
    });

    if (!student || !routine) {
      return { ok: false, error: 'Alumno o rutina inexistente.' };
    }

    await db.transaction(async (tx) => {
      let targetRoutineId = routine.id;

      // Si es una plantilla reutilizable, clonarla como rutina personal del alumno (Decisión D3)
      if (routine.isTemplate) {
        const [cloned] = await tx
          .insert(routines)
          .values({
            name: `${routine.name} (${student.firstName})`,
            description: routine.description,
            goal: routine.goal,
            level: routine.level,
            isTemplate: false,
            sourceRoutineId: routine.id,
            createdById: session.id,
            isActive: true,
          })
          .returning();

        targetRoutineId = cloned.id;

        // Clonar días y ejercicios
        for (const d of routine.days) {
          const [clonedDay] = await tx
            .insert(routineDays)
            .values({
              routineId: cloned.id,
              dayOfWeek: d.dayOfWeek,
              title: d.title,
              notes: d.notes,
            })
            .returning();

          if (d.exercises.length > 0) {
            await tx.insert(routineExercises).values(
              d.exercises.map((e) => ({
                routineDayId: clonedDay.id,
                exerciseId: e.exerciseId,
                position: e.position,
                sets: e.sets,
                reps: e.reps,
                load: e.load,
                restSeconds: e.restSeconds,
                tempo: e.tempo,
                supersetGroup: e.supersetGroup,
                notes: e.notes,
              })),
            );
          }
        }
      }

      // Desactivar cualquier rutina activa anterior del alumno
      await tx
        .update(studentRoutines)
        .set({ isActive: false, endDate: getTodayBusinessDate() })
        .where(
          and(eq(studentRoutines.studentId, student.id), eq(studentRoutines.isActive, true)),
        );

      // Asignar nueva rutina activa
      await tx.insert(studentRoutines).values({
        studentId: student.id,
        routineId: targetRoutineId,
        assignedById: session.id,
        startDate: getTodayBusinessDate(),
        isActive: true,
        notes: notes || null,
      });
    });

    revalidatePath(`/alumnos/${studentId}`);
    revalidatePath('/mi-rutina');
    revalidatePath('/dashboard');
    return { ok: true, data: undefined };
  } catch (error) {
    console.error('Error assignRoutineToStudentAction:', error);
    return { ok: false, error: 'Ocurrió un error al asignar la rutina al alumno.' };
  }
}
