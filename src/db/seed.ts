import { store } from './store';
import { logger } from '../lib/logger';

async function main() {
  logger.info('Running CineBook Database Seeder...');
  await store.seedInitialData();
  logger.info('Database seeded with sample movies, cinemas, auditoriums, seats, and showtimes!');
}

main()
  .then(() => {
    console.log('✅ Seeding completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
