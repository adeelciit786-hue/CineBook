import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genreSlug = searchParams.get('genre') || undefined;
    const search = searchParams.get('search') || undefined;
    const language = searchParams.get('language') || undefined;
    const cinemaId = searchParams.get('cinemaId') || undefined;
    const featuredParam = searchParams.get('featured');
    const featured = featuredParam !== null ? featuredParam === 'true' : undefined;

    const movies = await store.getMovies({
      genreSlug,
      search,
      language,
      cinemaId,
      featured,
    });

    const genres = Array.from(store.genres.values());

    return NextResponse.json({
      movies,
      genres,
      total: movies.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
