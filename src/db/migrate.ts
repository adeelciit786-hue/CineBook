import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from './index';
import { logger } from '../lib/logger';

export async function runMigrations() {
  logger.info('Starting CineBook database migrations...');
  try {
    const db = getDb();
    // In live PostgreSQL environments, runs schema migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Drizzle migrations completed successfully!');
  } catch (error) {
    logger.error('Migration error or offline database fallback in use:', error);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
