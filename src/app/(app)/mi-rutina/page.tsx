import React from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { students, studentRoutines, routineExercises } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { getCurrentDayOfWeek } from '@/utils/dates';
import { MyRoutineClient } from '@/components/students/MyRoutineClient';

export default async function MiRutinaPage() {
  const session = await requireRole('ALUMNO');

  const student = await db.query.students.findFirst({
    where: eq(students.userId, session.id),
    with: {
      routines: {
        where: eq(studentRoutines.isActive, true),
        with: {
          routine: {
            with: {
              days: {
                with: {
                  exercises: {
                    with: { exercise: true },
                    orderBy: [routineExercises.position],
                  },
                },
              },
            },
          },
        },
        limit: 1,
      },
    },
  });

  const activeAssignment = student?.routines[0];
  const activeRoutine = activeAssignment?.routine;
  const todayDay = getCurrentDayOfWeek();

  return (
    <MyRoutineClient
      routine={
        activeRoutine
          ? {
              id: activeRoutine.id,
              name: activeRoutine.name,
              goal: activeRoutine.goal,
              level: activeRoutine.level,
              notes: activeAssignment?.notes ?? null,
              days: activeRoutine.days.map((d) => ({
                id: d.id,
                dayOfWeek: d.dayOfWeek,
                title: d.title,
                notes: d.notes,
                exercises: d.exercises.map((e) => ({
                  id: e.id,
                  name: e.exercise.name,
                  muscleGroup: e.exercise.muscleGroup,
                  sets: e.sets,
                  reps: e.reps,
                  load: e.load,
                  restSeconds: e.restSeconds,
                  tempo: e.tempo,
                  notes: e.notes,
                })),
              })),
            }
          : null
      }
      todayDayOfWeek={todayDay}
    />
  );
}
