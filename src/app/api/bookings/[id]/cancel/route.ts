import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const { userId: guestUserId } = body;

    const effectiveUserId = user?.id || guestUserId || '';
    const isAdmin = user?.role === 'ADMIN';

    if (!effectiveUserId && !isAdmin) {
      return NextResponse.json(
        { error: 'Authentication required to cancel booking' },
        { status: 401 }
      );
    }

    const result = await store.cancelBooking(params.id, effectiveUserId, isAdmin);

    return NextResponse.json(result);
  } catch (err: any) {
    logger.error('Cancellation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to cancel booking' },
      { status: 400 }
    );
  }
}
