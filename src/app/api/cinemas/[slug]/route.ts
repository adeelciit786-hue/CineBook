import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cinema = await store.getCinemaBySlug(params.slug);
    if (!cinema) {
      return NextResponse.json({ error: 'Cinema not found' }, { status: 404 });
    }

    const auditoriums = Array.from(store.auditoriums.values()).filter(
      (a) => a.cinemaId === cinema.id
    );

    const showtimes = await store.getShowtimes({ cinemaId: cinema.id });

    return NextResponse.json({
      cinema,
      auditoriums,
      showtimes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch cinema details' },
      { status: 500 }
    );
  }
}
