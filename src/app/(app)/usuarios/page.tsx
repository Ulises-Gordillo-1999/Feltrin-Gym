import React from 'react';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { UsersClient } from '@/components/users/UsersClient';

export default async function UsuariosPage() {
  const session = await requireRole('ADMIN');

  const allUsers = await db.query.users.findMany({
    orderBy: [users.fullName],
  });

  return (
    <UsersClient
      usersList={allUsers.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }))}
      currentUserId={session.id}
    />
  );
}
