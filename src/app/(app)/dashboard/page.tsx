import React from 'react';
import { desc, eq, and, sql, gte } from 'drizzle-orm';
import { db } from '@/db';
import {
  students,
  financialTransactions,
  products,
  membershipPayments,
  routines,
  exercises,
  studentRoutines,
  routineDays,
  routineExercises,
  membershipPlans,
} from '@/db/schema';
import { requireSession } from '@/utils/session';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ProfesorDashboard } from '@/components/dashboard/ProfesorDashboard';
import { AlumnoDashboard } from '@/components/dashboard/AlumnoDashboard';
import { getCurrentDayOfWeek, getTodayBusinessDate } from '@/utils/dates';

export default async function DashboardPage() {
  const session = await requireSession();

  // ═══════════════════ VISTA ADMINISTRADOR ═══════════════════
  if (session.role === 'ADMIN') {
    // 1. Métricas de socios
    const allStudents = await db.query.students.findMany({
      columns: { id: true, status: true, membershipExpiresAt: true },
    });
    const totalStudents = allStudents.length;
    const activeStudents = allStudents.filter((s) => s.status === 'ACTIVO').length;

    // 2. Finanzas del mes actual (primer día del mes)
    const today = getTodayBusinessDate();
    const firstDayOfMonth = `${today.slice(0, 7)}-01T00:00:00Z`;

    const txsThisMonth = await db.query.financialTransactions.findMany({
      where: and(
        gte(financialTransactions.occurredAt, new Date(firstDayOfMonth)),
        eq(financialTransactions.status, 'COMPLETADO'),
      ),
      columns: { type: true, amount: true },
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    for (const tx of txsThisMonth) {
      if (tx.type === 'INGRESO') monthlyIncome += tx.amount;
      else if (tx.type === 'EGRESO') monthlyExpenses += tx.amount;
    }
    const netBalance = monthlyIncome - monthlyExpenses;

    // 3. Alumnos próximos a vencer o vencidos
    const expiringList = await db.query.students.findMany({
      where: eq(students.status, 'ACTIVO'),
      orderBy: [students.membershipExpiresAt],
      limit: 8,
      with: {
        currentPlan: { columns: { name: true } },
      },
    });

    // 4. Stock crítico (stock <= minStock)
    const lowStock = await db.query.products.findMany({
      where: and(
        sql`${products.stock} <= ${products.minStock}`,
        eq(products.isActive, true),
      ),
      limit: 6,
    });

    // 5. Cobros recientes
    const recentPayments = await db.query.membershipPayments.findMany({
      where: eq(membershipPayments.status, 'COMPLETADO'),
      orderBy: [desc(membershipPayments.paidAt)],
      limit: 6,
      with: {
        student: { columns: { firstName: true, lastName: true } },
      },
    });

    return (
      <AdminDashboard
        stats={{
          totalStudents,
          activeStudents,
          monthlyIncome,
          monthlyExpenses,
          netBalance,
        }}
        expiringStudents={expiringList.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          dni: s.dni,
          phone: s.phone,
          membershipExpiresAt: s.membershipExpiresAt,
          currentPlanName: s.currentPlan?.name ?? null,
        }))}
        lowStockProducts={lowStock.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
        }))}
        recentPayments={recentPayments.map((p) => ({
          id: p.id,
          receiptNumber: p.receiptNumber,
          studentName: `${p.student.lastName}, ${p.student.firstName}`,
          planName: p.planNameSnapshot,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
        }))}
      />
    );
  }

  // ═══════════════════ VISTA PROFESOR ═══════════════════
  if (session.role === 'PROFESOR') {
    const trainees = await db.query.students.findMany({
      where: eq(students.assignedTrainerId, session.id),
      orderBy: [students.lastName],
      with: {
        routines: {
          where: eq(studentRoutines.isActive, true),
          with: {
            routine: { columns: { name: true } },
          },
          limit: 1,
        },
      },
    });

    const totalTemplates = await db.$count(routines, eq(routines.isTemplate, true));
    const totalExercises = await db.$count(exercises, eq(exercises.isActive, true));

    return (
      <ProfesorDashboard
        trainerName={session.fullName}
        totalTemplates={totalTemplates}
        totalExercises={totalExercises}
        trainees={trainees.map((t) => ({
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          dni: t.dni,
          membershipExpiresAt: t.membershipExpiresAt,
          activeRoutineName: t.routines[0]?.routine.name ?? null,
        }))}
      />
    );
  }

  // ═══════════════════ VISTA ALUMNO ═══════════════════
  const student = await db.query.students.findFirst({
    where: eq(students.userId, session.id),
    with: {
      currentPlan: { columns: { name: true } },
      payments: {
        where: eq(membershipPayments.status, 'COMPLETADO'),
        orderBy: [desc(membershipPayments.paidAt)],
        limit: 1,
      },
      routines: {
        where: eq(studentRoutines.isActive, true),
        with: {
          routine: {
            with: {
              days: {
                with: {
                  exercises: {
                    with: {
                      exercise: true,
                    },
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

  const todayDayOfWeek = getCurrentDayOfWeek();

  if (!student) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-zinc-100">Ficha de alumno en preparación</h2>
        <p className="text-sm text-zinc-400 mt-2">
          Tu cuenta de usuario está activa pero aún no tiene una ficha de alumno asociada. Acercate a recepción para vincular tu legajo.
        </p>
      </div>
    );
  }

  const activeAssignment = student.routines[0];
  const activeRoutine = activeAssignment?.routine;

  // Buscar el día de hoy dentro de la rutina asignada
  const todayDayRecord = activeRoutine?.days.find(
    (d) => d.dayOfWeek === todayDayOfWeek,
  );

  const todayWorkout = todayDayRecord
    ? {
        title: todayDayRecord.title,
        notes: todayDayRecord.notes,
        exercises: todayDayRecord.exercises.map((e) => ({
          id: e.id,
          position: e.position,
          exerciseName: e.exercise.name,
          muscleGroup: e.exercise.muscleGroup,
          sets: e.sets,
          reps: e.reps,
          load: e.load,
          restSeconds: e.restSeconds,
          tempo: e.tempo,
          notes: e.notes,
        })),
      }
    : null;

  const lastPayment = student.payments[0];

  return (
    <AlumnoDashboard
      student={{
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        membershipExpiresAt: student.membershipExpiresAt,
        lastPaymentAt: student.lastPaymentAt,
        currentPlanName: student.currentPlan?.name ?? null,
        lastPaymentId: lastPayment?.id ?? null,
        lastReceiptNumber: lastPayment?.receiptNumber ?? null,
      }}
      todayDayOfWeek={todayDayOfWeek}
      todayWorkout={todayWorkout}
      activeRoutineName={activeRoutine?.name ?? null}
      activeRoutineId={activeRoutine?.id ?? null}
    />
  );
}
