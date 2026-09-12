import { NextResponse } from 'next/server';
import { store } from '@/db/store';

export async function GET() {
  try {
    const cinemas = await store.getCinemas();
    return NextResponse.json({
      cinemas,
      total: cinemas.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch cinemas' },
      { status: 500 }
    );
  }
}
