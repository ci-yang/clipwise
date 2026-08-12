/**
 * GET /api/dev/health — preflight：回非機密設定，讓驗證腳本先確認環境接對了。
 * 不回任何 key/secret 值，只回前綴與旗標。
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const key = process.env.PORTALY_API_KEY ?? '';
  const mode = key.startsWith('pcs_live_') ? 'live' : key.startsWith('pcs_test_') ? 'test' : 'unknown';

  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return NextResponse.json({
    mode,
    keyPrefix: key.slice(0, 9) || null,
    hasCallbackSecret: Boolean(process.env.PORTALY_CALLBACK_SECRET),
    apiHost: process.env.PORTALY_API_HOST ?? null,
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED === 'true',
    db,
  });
}
