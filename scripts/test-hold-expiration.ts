import { store } from '../src/db/store';

export async function testHoldExpiration() {
  console.log('🧪 Running Test: Seat Hold Expiration & Automatic Cleanup...');
  await store.seedInitialData();

  const showtimeId = 'st-dune-today-1';
  const showtimeDetails = await store.getShowtimeWithDetails(showtimeId);
  const targetSeat = showtimeDetails?.allSeats.find((s) => s.status === 'AVAILABLE');

  if (!targetSeat) {
    throw new Error('No available seat for hold test');
  }

  // 1. Create a 10-minute seat hold
  const hold = await store.createHoldBooking({
    showtimeId,
    seatIds: [targetSeat.seatId],
    userId: 'u-cust-001',
  });

  const heldBookingId = hold.booking.id;
  console.log(`  Created hold for booking ${hold.booking.bookingReference}, seat: ${targetSeat.seatLabel}`);

  // Verify seat is HELD
  let stSeat = Array.from(store.showtimeSeats.values()).find(
    (s) => s.showtimeId === showtimeId && s.seatId === targetSeat.seatId
  );
  if (stSeat?.status !== 'HELD') {
    throw new Error('Expected seat to be in HELD status');
  }

  // 2. Simulate time expiration by setting expiresAt and heldUntil in the past
  const pastTime = new Date(Date.now() - 1000 * 60); // 1 minute in past
  const bookingRecord = store.bookings.get(heldBookingId)!;
  bookingRecord.expiresAt = pastTime;
  stSeat.heldUntil = pastTime;

  // 3. Run the Idempotent Expired Hold Cleaner
  const cleanupResult = await store.releaseExpiredHolds();
  console.log(
    `  Cleanup execution: Released ${cleanupResult.releasedSeatsCount} seats, expired ${cleanupResult.expiredBookingsCount} bookings.`
  );

  // 4. Verify seat returned to AVAILABLE
  stSeat = Array.from(store.showtimeSeats.values()).find(
    (s) => s.showtimeId === showtimeId && s.seatId === targetSeat.seatId
  );

  if (stSeat?.status !== 'AVAILABLE') {
    throw new Error(`Expected seat to be AVAILABLE, but got ${stSeat?.status}`);
  }

  if (bookingRecord.status !== 'EXPIRED') {
    throw new Error(`Expected booking to be EXPIRED, but got ${bookingRecord.status}`);
  }

  console.log('✅ PASS: Expired holds were correctly released and returned to available pool.\n');
  return true;
}

if (require.main === module) {
  testHoldExpiration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
