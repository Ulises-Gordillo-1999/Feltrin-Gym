import React from 'react';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  students,
  membershipPlans,
  membershipPayments,
  studentRoutines,
  routines,
  routineExercises,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import { StudentDetailClient } from '@/components/students/StudentDetailClient';

export default async function StudentDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(['ADMIN', 'PROFESOR']);
  const { id } = await props.params;

  const student = await db.query.students.findFirst({
    where: eq(students.id, id),
    with: {
      currentPlan: true,
      trainer: true,
      payments: {
        orderBy: [desc(membershipPayments.paidAt)],
      },
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

  if (!student) {
    notFound();
  }

  const plans = await db.query.membershipPlans.findMany({
    where: eq(membershipPlans.isActive, true),
    orderBy: [membershipPlans.price],
  });

  const availableRoutines = await db.query.routines.findMany({
    where: eq(routines.isActive, true),
    orderBy: [desc(routines.isTemplate), routines.name],
  });

  const activeAssignment = student.routines[0];
  const activeRoutine = activeAssignment?.routine;

  return (
    <StudentDetailClient
      student={{
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        email: student.email,
        phone: student.phone,
        birthDate: student.birthDate,
        address: student.address,
        emergencyContactName: student.emergencyContactName,
        emergencyContactPhone: student.emergencyContactPhone,
        medicalNotes: student.medicalNotes,
        photoUrl: student.photoUrl,
        status: student.status,
        membershipExpiresAt: student.membershipExpiresAt,
        lastPaymentAt: student.lastPaymentAt,
        currentPlanId: student.currentPlanId,
        currentPlanName: student.currentPlan?.name ?? null,
        trainerName: student.trainer?.fullName ?? null,
      }}
      payments={student.payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        planName: p.planNameSnapshot,
        listPrice: p.listPrice,
        discount: p.discount,
        amount: p.amount,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
        voidReason: p.voidReason,
      }))}
      activeRoutine={
        activeRoutine
          ? {
              id: activeRoutine.id,
              name: activeRoutine.name,
              goal: activeRoutine.goal,
              level: activeRoutine.level,
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
      plans={plans}
      availableRoutines={availableRoutines.map((r) => ({
        id: r.id,
        name: r.name,
        goal: r.goal,
        level: r.level,
      }))}
      isAdmin={session.role === 'ADMIN'}
    />
  );
}
