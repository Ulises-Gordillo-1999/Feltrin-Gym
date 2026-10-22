import React from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { gymSettings } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default async function ConfiguracionPage() {
  await requireRole('ADMIN');

  let settings = await db.query.gymSettings.findFirst({
    where: eq(gymSettings.id, 1),
  });

  if (!settings) {
    const [inserted] = await db
      .insert(gymSettings)
      .values({
        id: 1,
        gymName: 'Centro de Entrenamiento Feltrin',
      })
      .returning();
    settings = inserted;
  }

  return <SettingsClient settings={settings} />;
}
