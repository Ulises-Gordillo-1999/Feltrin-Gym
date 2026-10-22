import React from 'react';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { routines, routineExercises, exercises, students } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { RoutineBuilderClient } from '@/components/routines/RoutineBuilderClient';

export default async function RoutineDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['ADMIN', 'PROFESOR']);
  const { id } = await props.params;

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, id),
    with: {
      days: {
        with: {
          exercises: {
            orderBy: [routineExercises.position],
          },
        },
      },
    },
  });

  if (!routine) {
    notFound();
  }

  const allExercises = await db.query.exercises.findMany({
    where: eq(exercises.isActive, true),
    orderBy: [asc(exercises.muscleGroup), asc(exercises.name)],
    columns: { id: true, name: true, muscleGroup: true },
  });

  const allStudents = await db.query.students.findMany({
    where: eq(students.status, 'ACTIVO'),
    orderBy: [students.lastName],
    columns: { id: true, firstName: true, lastName: true, dni: true },
  });

  return (
    <RoutineBuilderClient
      routine={{
        id: routine.id,
        name: routine.name,
        description: routine.description,
        goal: routine.goal,
        level: routine.level,
        isTemplate: routine.isTemplate,
        days: routine.days.map((d) => ({
          id: d.id,
          dayOfWeek: d.dayOfWeek,
          title: d.title,
          notes: d.notes,
          exercises: d.exercises.map((e) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            position: e.position,
            sets: e.sets,
            reps: e.reps,
            load: e.load,
            restSeconds: e.restSeconds,
            tempo: e.tempo,
            notes: e.notes,
          })),
        })),
      }}
      exerciseLibrary={allExercises}
      students={allStudents.map((s) => ({
        id: s.id,
        fullName: `${s.lastName}, ${s.firstName}`,
        dni: s.dni,
      }))}
    />
  );
}
