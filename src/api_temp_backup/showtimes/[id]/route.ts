import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';

export function generateStaticParams() {
  return [
    { id: 'st-dune-today-1' },
    { id: 'st-dune-today-2' },
    { id: 'st-dune-tomorrow-1' },
    { id: 'st-opp-today-1' },
    { id: 'st-opp-today-2' },
    { id: 'st-inter-today-1' },
  ];
}

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
