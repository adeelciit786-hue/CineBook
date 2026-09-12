import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { showtimeId, seatIds, guestUserId } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid showtimeId and seatIds array are required' },
        { status: 400 }
      );
    }

    // Allow logged-in user or guest session user ID
    const effectiveUserId = user?.id || guestUserId || 'u-guest-session';

    const result = await store.createHoldBooking({
      showtimeId,
      seatIds,
      userId: effectiveUserId,
    });

    return NextResponse.json(
      {
        success: true,
        bookingId: result.booking.id,
        bookingReference: result.booking.bookingReference,
        expiresAt: result.expiresAt,
        totalAmountCents: result.totalAmountCents,
        items: result.items,
      },
      { status: 201 }
    );
  } catch (err: any) {
    logger.warn('Seat hold conflict or validation error:', { message: err.message });
    const isConflict =
      err.message?.includes('already booked') ||
      err.message?.includes('currently held') ||
      err.message?.includes('unavailable');

    return NextResponse.json(
      { error: err.message || 'Failed to hold seats' },
      { status: isConflict ? 409 : 400 }
    );
  }
}
