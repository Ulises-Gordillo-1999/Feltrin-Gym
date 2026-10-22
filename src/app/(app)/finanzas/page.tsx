import React from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { financialTransactions, financeCategories } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { FinanceClient } from '@/components/finance/FinanceClient';

export default async function FinanzasPage() {
  await requireRole('ADMIN');

  const allTransactions = await db.query.financialTransactions.findMany({
    orderBy: [desc(financialTransactions.occurredAt)],
    with: {
      category: { columns: { name: true } },
      registeredBy: { columns: { fullName: true } },
    },
  });

  const categories = await db.query.financeCategories.findMany({
    where: eq(financeCategories.isActive, true),
    orderBy: [financeCategories.name],
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of allTransactions) {
    if (t.status === 'COMPLETADO') {
      if (t.type === 'INGRESO') totalIncome += t.amount;
      else if (t.type === 'EGRESO') totalExpenses += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpenses;

  return (
    <FinanceClient
      transactions={allTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        categoryName: t.category?.name ?? 'General',
        amount: t.amount,
        paymentMethod: t.paymentMethod,
        description: t.description,
        occurredAt: t.occurredAt,
        status: t.status,
        receiptImageUrl: t.receiptImageUrl,
        registeredByName: t.registeredBy?.fullName ?? 'Admin',
        isAutomatic: !!(t.membershipPaymentId || t.saleId),
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }))}
      summary={{
        totalIncome,
        totalExpenses,
        netBalance,
      }}
    />
  );
}
