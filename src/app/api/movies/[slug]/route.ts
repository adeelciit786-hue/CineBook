import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const movie = await store.getMovieBySlug(params.slug);
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Retrieve movie genres
    const movieGenres = Array.from(store.genres.values()).filter((g) =>
      movie.genreIds.includes(g.id)
    );

    // Retrieve upcoming showtimes for this movie
    const showtimes = await store.getShowtimes({ movieId: movie.id });

    return NextResponse.json({
      movie,
      genres: movieGenres,
      showtimes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch movie' },
      { status: 500 }
    );
  }
}
