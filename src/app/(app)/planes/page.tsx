import React from 'react';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { membershipPlans } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { PlansClient } from '@/components/plans/PlansClient';

export default async function PlanesPage() {
  await requireRole('ADMIN');

  const allPlans = await db.query.membershipPlans.findMany({
    orderBy: [desc(membershipPlans.isActive), membershipPlans.price],
  });

  return (
    <PlansClient
      plans={allPlans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        durationValue: p.durationValue,
        durationUnit: p.durationUnit,
        sessionsPerWeek: p.sessionsPerWeek,
        isActive: p.isActive,
      }))}
    />
  );
}
