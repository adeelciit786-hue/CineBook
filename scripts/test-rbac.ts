import { store } from '../src/db/store';

export async function testRbacAndIsolation() {
  console.log('🧪 Running Test: User Isolation, RBAC Security & Cancellation Rules...');
  await store.seedInitialData();

  const userA = 'u-cust-001';
  const userB = 'u-cust-002';
  const showtimeId = 'st-dune-tomorrow-1';

  // 1. User A books a seat
  const showtimeDetails = await store.getShowtimeWithDetails(showtimeId);
  const targetSeat = showtimeDetails?.allSeats.find((s) => s.status === 'AVAILABLE')!;

  const hold = await store.createHoldBooking({
    showtimeId,
    seatIds: [targetSeat.seatId],
    userId: userA,
  });

  const booking = (
    await store.confirmBookingPayment({
      bookingId: hold.booking.id,
      paymentMethod: {
        type: 'test_card',
        cardNumber: '4242 4242 4242 4242',
        cardholderName: 'Sarah Jenkins',
        testOutcome: 'success',
      },
    })
  ).booking;

  console.log(`  User A created booking: ${booking.bookingReference}`);

  // 2. User B attempts to access User A's booking -> Must be blocked
  let accessBlocked = false;
  try {
    await store.getBookingDetails(booking.id, userB, false);
  } catch (err: any) {
    if (err.message.includes('Access denied')) {
      accessBlocked = true;
    }
  }

  if (!accessBlocked) {
    throw new Error('SECURITY BREACH: User B was able to access User A’s private booking!');
  }
  console.log('  User B access to User A’s booking was strictly blocked.');

  // 3. User B attempts to cancel User A's booking -> Must be blocked
  let cancelBlocked = false;
  try {
    await store.cancelBooking(booking.id, userB, false);
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      cancelBlocked = true;
    }
  }

  if (!cancelBlocked) {
    throw new Error('SECURITY BREACH: User B was able to cancel User A’s booking!');
  }
  console.log('  User B cancellation attempt was strictly rejected.');

  // 4. User A cancels their own eligible booking -> Must succeed and release seat
  const cancelResult = await store.cancelBooking(booking.id, userA, false);
  if (!cancelResult.success) {
    throw new Error('User A was unable to cancel their own eligible booking');
  }

  // Verify seat returned to AVAILABLE
  const stSeat = Array.from(store.showtimeSeats.values()).find(
    (s) => s.showtimeId === showtimeId && s.seatId === targetSeat.seatId
  );

  if (stSeat?.status !== 'AVAILABLE') {
    throw new Error(`Expected seat to be released to AVAILABLE, got ${stSeat?.status}`);
  }

  console.log('✅ PASS: RBAC, User Isolation, and Cancellation rules successfully verified.\n');
  return true;
}

if (require.main === module) {
  testRbacAndIsolation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
