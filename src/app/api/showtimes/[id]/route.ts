import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const details = await store.getShowtimeWithDetails(params.id);
    if (!details) {
      return NextResponse.json(
        { error: 'Showtime not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch showtime seat map' },
      { status: 500 }
    );
  }
}
