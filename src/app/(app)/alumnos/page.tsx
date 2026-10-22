import React from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { students, membershipPlans, users } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { StudentsListClient } from '@/components/students/StudentsListClient';

export default async function AlumnosPage() {
  const session = await requireRole(['ADMIN', 'PROFESOR']);

  const allStudents = await db.query.students.findMany({
    orderBy: [desc(students.createdAt)],
    with: {
      currentPlan: { columns: { name: true } },
      trainer: { columns: { fullName: true } },
    },
  });

  const plans = await db.query.membershipPlans.findMany({
    where: eq(membershipPlans.isActive, true),
    columns: { id: true, name: true, price: true },
  });

  const trainers = await db.query.users.findMany({
    where: eq(users.role, 'PROFESOR'),
    columns: { id: true, fullName: true },
  });

  return (
    <StudentsListClient
      students={allStudents.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        dni: s.dni,
        email: s.email,
        phone: s.phone,
        photoUrl: s.photoUrl,
        status: s.status,
        membershipExpiresAt: s.membershipExpiresAt,
        currentPlanName: s.currentPlan?.name ?? null,
        trainerName: s.trainer?.fullName ?? null,
      }))}
      plans={plans}
      trainers={trainers}
      canCreate={session.role === 'ADMIN' || session.role === 'PROFESOR'}
    />
  );
}
