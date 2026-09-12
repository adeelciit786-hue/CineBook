import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  return handleRelease(req);
}

export async function POST(req: NextRequest) {
  return handleRelease(req);
}

async function handleRelease(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');

    const cronSecret = process.env.CRON_SECRET || 'cinebook_cron_secret_auth_token_99482';

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      logger.warn('Unauthorized attempt to trigger release-holds cron endpoint');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await store.releaseExpiredHolds();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    logger.error('Error during expired holds release cron:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
