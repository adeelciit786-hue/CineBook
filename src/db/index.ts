import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: Pool | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/cinebook';

  pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export { schema };
export type Database = ReturnType<typeof getDb>;
