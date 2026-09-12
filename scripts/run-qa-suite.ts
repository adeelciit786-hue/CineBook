import { testConcurrency } from './test-concurrency';
import { testHoldExpiration } from './test-hold-expiration';
import { testPaymentIdempotency } from './test-payment-idempotency';
import { testRbacAndIsolation } from './test-rbac';
import { store } from '../src/db/store';

async function runCompleteQaSuite() {
  console.log('===========================================================');
  console.log('🎬 CINEBOOK COMPREHENSIVE QA AUTOMATION HARNESS');
  console.log('   Agent 3 Verification: Concurrency, TTLs, RBAC & End-to-End');
  console.log('===========================================================\n');

  const startTime = Date.now();
  let passedCount = 0;
  let totalTests = 5;

  try {
    // 1. Concurrency Race-Condition Test
    await testConcurrency();
    passedCount++;

    // 2. Hold Expiration Test
    await testHoldExpiration();
    passedCount++;

    // 3. Payment Idempotency Test
    await testPaymentIdempotency();
    passedCount++;

    // 4. RBAC & User Isolation Test
    await testRbacAndIsolation();
    passedCount++;

    // 5. End-to-End Complete Booking & Scanner Lifecycle
    console.log('🧪 Running Test: End-to-End Patron Journey & Check-In Validation...');
    await store.seedInitialData();

    // 5.1 Browse & Search
    const searchResults = await store.getMovies({ search: 'Dune' });
    if (searchResults.length === 0) throw new Error('Movie search failed');

    // 5.2 Select Showtime & Seats
    const showtimes = await store.getShowtimes({ movieId: searchResults[0].id });
    if (showtimes.length === 0) throw new Error('Showtimes lookup failed');

    const stDetails = await store.getShowtimeWithDetails(showtimes[0].id);
    const availableSeats = stDetails?.allSeats.filter((s) => s.status === 'AVAILABLE') || [];
    if (availableSeats.length < 2) throw new Error('Not enough available seats');

    const selectedSeatIds = [availableSeats[0].seatId, availableSeats[1].seatId];

    // 5.3 Hold Seats
    const hold = await store.createHoldBooking({
      showtimeId: showtimes[0].id,
      seatIds: selectedSeatIds,
      userId: 'u-cust-001',
    });

    // 5.4 Confirm Payment
    const payment = await store.confirmBookingPayment({
      bookingId: hold.booking.id,
      paymentMethod: {
        type: 'test_card',
        cardNumber: '4242 4242 4242 4242',
        cardholderName: 'Sarah Jenkins',
        testOutcome: 'success',
      },
    });

    if (!payment.success || payment.tickets.length !== 2) {
      throw new Error('E2E payment failed or tickets not minted');
    }

    // 5.5 Admin QR Check-In Scanner Validation
    const ticketCode = payment.tickets[0].ticketCode;
    const checkIn = await store.verifyAndCheckInTicket(ticketCode);
    if (!checkIn.success) {
      throw new Error('E2E Ticket check-in failed');
    }

    // 5.6 Prevent Double Check-In
    const repeatCheckIn = await store.verifyAndCheckInTicket(ticketCode);
    if (repeatCheckIn.success) {
      throw new Error('SECURITY BUG: Same ticket was checked in twice!');
    }

    console.log('✅ PASS: Complete End-to-End booking and scanner cycle succeeded.\n');
    passedCount++;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('===========================================================');
    console.log(`🎉 ALL ${passedCount}/${totalTests} QA TEST SUITES PASSED! (${duration}s)`);
    console.log('   CineBook system is verified and production-ready.');
    console.log('===========================================================');
  } catch (error) {
    console.error('\n❌ QA TEST SUITE ENCOUNTERED A FAILURE:', error);
    process.exit(1);
  }
}

runCompleteQaSuite();
