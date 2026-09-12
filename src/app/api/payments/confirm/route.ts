import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { bookingId, paymentMethod, idempotencyKey } = body;

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { error: 'bookingId and paymentMethod are required' },
        { status: 400 }
      );
    }

    const result = await store.confirmBookingPayment({
      bookingId,
      userId: user?.id,
      paymentMethod,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.errorMessage || 'Payment processing failed',
          payment: result.payment,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      tickets: result.tickets,
      payment: result.payment,
    });
  } catch (err: any) {
    logger.error('Payment confirmation error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment confirmation error' },
      { status: 400 }
    );
  }
}
