import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const stats = await store.getAdminStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
