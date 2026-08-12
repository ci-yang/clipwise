/**
 * POST /api/dev/login — dev-only：用 email 直接發 session，不走 Google。
 *
 * 兩個用途：讓 agent / CI 任意指定 customerEmail 測不同情境；讓 PR preview
 * 不需要 Google OAuth（redirect URI 對不上動態網域）也能登入。
 * 只在 DEV_LOGIN_ENABLED=true 時開，production 永遠關。
 */
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export async function POST(request: Request) {
  if (process.env.DEV_LOGIN_ENABLED !== 'true') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let email: string | undefined;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: '缺少 email' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split('@')[0] },
  });

  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const res = NextResponse.json({ ok: true, userId: user.id, email });
  res.cookies.set(COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
  return res;
}
