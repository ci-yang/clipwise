/**
 * POST /api/portaly/checkout — 建 checkout session
 * 用登入者的 email 當 customerEmail，建完在本地記一筆 pending 訂閱。
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/portaly';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: '未登入，請先登入' }, { status: 401 });
  }

  let planId: string | undefined;
  try {
    ({ planId } = await request.json());
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 });
  }
  if (!planId) {
    return NextResponse.json({ error: '缺少 planId' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  try {
    const { sessionId, checkoutUrl } = await createCheckoutSession({
      planId,
      customerEmail: session.user.email,
      returnUrl: `${origin}/billing`,
    });

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        portalySubscriptionId: sessionId,
        planId,
        status: 'pending',
        mode: process.env.PORTALY_API_KEY?.startsWith('pcs_live_') ? 'live' : 'test',
        customerEmail: session.user.email,
      },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '建立結帳失敗，請稍後再試';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
