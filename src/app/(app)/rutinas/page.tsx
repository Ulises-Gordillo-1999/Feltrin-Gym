import React from 'react';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { routines } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { RoutinesCatalogClient } from '@/components/routines/RoutinesCatalogClient';

export default async function RutinasPage() {
  await requireRole(['ADMIN', 'PROFESOR']);

  const allRoutines = await db.query.routines.findMany({
    orderBy: [desc(routines.isTemplate), desc(routines.createdAt)],
    with: {
      createdBy: { columns: { fullName: true } },
      days: {
        with: {
          exercises: { columns: { id: true } },
        },
      },
    },
  });

  return (
    <RoutinesCatalogClient
      routines={allRoutines.map((r) => {
        const totalEx = r.days.reduce((acc, d) => acc + d.exercises.length, 0);
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          goal: r.goal,
          level: r.level,
          isTemplate: r.isTemplate,
          creatorName: r.createdBy?.fullName ?? 'Staff',
          daysCount: r.days.length,
          exercisesCount: totalEx,
        };
      })}
    />
  );
}
