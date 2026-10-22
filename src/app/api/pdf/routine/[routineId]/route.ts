import { NextRequest, NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { routines, gymSettings, routineExercises, studentRoutines } from '@/db/schema';
import { getSession } from '@/utils/session';
import { generateRoutinePdf } from '@/utils/pdf/routine';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ routineId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const { routineId } = await context.params;

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
    with: {
      createdBy: { columns: { fullName: true } },
      days: {
        with: {
          exercises: {
            with: { exercise: true },
            orderBy: [routineExercises.position],
          },
        },
      },
    },
  });

  if (!routine) {
    return new NextResponse('Rutina no encontrada', { status: 404 });
  }

  // Buscar si está asignada a un alumno para incluir su nombre
  const assignment = await db.query.studentRoutines.findFirst({
    where: eq(studentRoutines.routineId, routine.id),
    with: {
      student: { columns: { firstName: true, lastName: true } },
    },
  });

  const settings = await db.query.gymSettings.findFirst({
    where: eq(gymSettings.id, 1),
  });

  const pdfBytes = generateRoutinePdf({
    gymName: settings?.gymName || 'Centro de Entrenamiento Feltrin',
    routineName: routine.name,
    goal: routine.goal,
    level: routine.level,
    trainerName: routine.createdBy?.fullName || 'Staff Feltrin',
    studentName: assignment?.student
      ? `${assignment.student.lastName}, ${assignment.student.firstName}`
      : undefined,
    assignedDate: assignment?.startDate,
    notes: routine.description,
    days: routine.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      title: d.title,
      exercises: d.exercises.map((e) => ({
        name: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup,
        sets: e.sets,
        reps: e.reps,
        load: e.load,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    })),
  });

  const filename = `rutina-feltrin-${routine.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
