import { store } from '../src/db/store';
import { verifyTicketPayload } from '../src/lib/qrcode';

export async function testPaymentIdempotency() {
  console.log('🧪 Running Test: Payment Confirmation, Idempotency & QR Ticket Signature...');
  await store.seedInitialData();

  const showtimeId = 'st-dune-today-1';
  const showtimeDetails = await store.getShowtimeWithDetails(showtimeId);
  const targetSeat = showtimeDetails?.allSeats.find((s) => s.status === 'AVAILABLE')!;

  // 1. Create Seat Hold
  const hold = await store.createHoldBooking({
    showtimeId,
    seatIds: [targetSeat.seatId],
    userId: 'u-cust-001',
  });

  const bookingId = hold.booking.id;
  const idempotencyKey = `idem_test_${Date.now()}`;

  // 2. First Payment Confirmation
  const payment1 = await store.confirmBookingPayment({
    bookingId,
    paymentMethod: {
      type: 'test_card',
      cardNumber: '4242 4242 4242 4242',
      cardholderName: 'Sarah Jenkins',
      testOutcome: 'success',
    },
    idempotencyKey,
  });

  if (!payment1.success || payment1.booking.status !== 'CONFIRMED') {
    throw new Error('Expected payment 1 to succeed and confirm booking');
  }

  if (payment1.tickets.length !== 1) {
    throw new Error(`Expected 1 ticket to be minted, got ${payment1.tickets.length}`);
  }

  // Verify HMAC signature of minted ticket
  const ticket = payment1.tickets[0];
  const qrVerification = verifyTicketPayload(ticket.qrCodeData);
  if (!qrVerification.valid) {
    throw new Error(`QR Signature verification failed: ${qrVerification.error}`);
  }
  console.log(`  Ticket minted with verified cryptographic HMAC signature: ${ticket.ticketCode}`);

  // 3. Duplicate Webhook / Duplicate Request with same idempotency key
  const payment2 = await store.confirmBookingPayment({
    bookingId,
    paymentMethod: {
      type: 'test_card',
      cardNumber: '4242 4242 4242 4242',
      cardholderName: 'Sarah Jenkins',
      testOutcome: 'success',
    },
    idempotencyKey,
  });

  if (!payment2.success || payment2.booking.status !== 'CONFIRMED') {
    throw new Error('Expected duplicate idempotent call to return success');
  }

  // Verify total tickets in database hasn't doubled
  const allTicketsForBooking = Array.from(store.tickets.values()).filter(
    (t) => t.bookingId === bookingId
  );

  if (allTicketsForBooking.length !== 1) {
    throw new Error(
      `IDEMPOTENCY FAILURE: Found ${allTicketsForBooking.length} tickets instead of strictly 1!`
    );
  }

  console.log('✅ PASS: Payment processing and webhook idempotency guarantee verified.\n');
  return true;
}

if (require.main === module) {
  testPaymentIdempotency()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
