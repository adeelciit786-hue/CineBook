import { store } from '../src/db/store';

export async function testConcurrency() {
  console.log('🧪 Running Test: Concurrent Seat Booking & Race Condition Prevention...');
  await store.seedInitialData();

  const showtimeId = 'st-dune-today-1';
  // Pick an available seat
  const showtimeSeats = await store.getShowtimeWithDetails(showtimeId);
  const targetSeat = showtimeSeats?.allSeats.find((s) => s.status === 'AVAILABLE');

  if (!targetSeat) {
    throw new Error('No available seat found in showtime for concurrency test');
  }

  const seatId = targetSeat.seatId;
  const seatLabel = targetSeat.seatLabel;
  console.log(`  Target Seat for Race Condition: ${seatLabel} (Seat ID: ${seatId})`);

  // Spawn 10 simultaneous concurrent requests trying to hold this exact seat
  const concurrentAttempts = 10;
  const promises: Promise<{ success: boolean; bookingId?: string; error?: string }>[] = [];

  for (let i = 0; i < concurrentAttempts; i++) {
    const userId = `u-race-user-${i}`;
    promises.push(
      store
        .createHoldBooking({
          showtimeId,
          seatIds: [seatId],
          userId,
        })
        .then((res) => ({ success: true, bookingId: res.booking.id }))
        .catch((err) => ({ success: false, error: err.message }))
    );
  }

  const results = await Promise.all(promises);

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  console.log(`  Results: ${successes.length} succeeded, ${failures.length} rejected.`);

  if (successes.length !== 1) {
    throw new Error(
      `CRITICAL CONCURRENCY FAILURE: Expected strictly 1 success, but got ${successes.length} successes!`
    );
  }

  if (failures.length !== concurrentAttempts - 1) {
    throw new Error(
      `Expected ${concurrentAttempts - 1} rejections, but got ${failures.length}`
    );
  }

  console.log('✅ PASS: Concurrency lock successfully prevented double-booking under race conditions.\n');
  return true;
}

if (require.main === module) {
  testConcurrency()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
