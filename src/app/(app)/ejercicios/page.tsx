import React from 'react';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { exercises } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { ExercisesClient } from '@/components/routines/ExercisesClient';

export default async function EjerciciosPage() {
  await requireRole(['ADMIN', 'PROFESOR']);

  const allExercises = await db.query.exercises.findMany({
    where: (e, { eq }) => eq(e.isActive, true),
    orderBy: [asc(exercises.muscleGroup), asc(exercises.name)],
  });

  return (
    <ExercisesClient
      exercises={allExercises.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscleGroup,
        equipment: e.equipment,
        description: e.description,
        videoUrl: e.videoUrl,
        isActive: e.isActive,
      }))}
    />
  );
}
