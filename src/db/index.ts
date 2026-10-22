import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida');
}

type Sql = ReturnType<typeof postgres>;

/**
 * Singleton de conexión: en desarrollo, el HMR de Next re-evalúa módulos y
 * abriría un pool nuevo en cada recarga. Se cachea en globalThis.
 */
const globalForDb = globalThis as unknown as { __feltrinSql?: Sql };

export const client: Sql =
  globalForDb.__feltrinSql ??
  postgres(databaseUrl, {
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.__feltrinSql = client;

export const db = drizzle(client, { schema, casing: 'snake_case' });
export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
