import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    const details = await store.getBookingDetails(
      params.id,
      user?.id,
      user?.role === 'ADMIN'
    );

    if (!details) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (err: any) {
    const isForbidden = err.message?.includes('Access denied');
    return NextResponse.json(
      { error: err.message || 'Failed to fetch booking' },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
