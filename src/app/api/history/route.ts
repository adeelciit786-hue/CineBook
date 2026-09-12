import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const guestUserId = searchParams.get('userId');

    const effectiveUserId = user?.id || guestUserId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'User authentication or guest user id required' },
        { status: 401 }
      );
    }

    const bookings = await store.getUserBookings(effectiveUserId);
    return NextResponse.json({ bookings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch booking history' },
      { status: 500 }
    );
  }
}
