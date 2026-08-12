/**
 * POST /api/portaly/cancel — 代理訂閱取消到 Portaly。
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelSubscription } from '@/lib/portaly';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登入，請先登入' }, { status: 401 });
  }

  let subscriptionId: string | undefined;
  try {
    ({ subscriptionId } = await request.json());
  } catch {
    return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 });
  }
  if (!subscriptionId) {
    return NextResponse.json({ error: '缺少 subscriptionId' }, { status: 400 });
  }

  // 只能操作自己的訂閱
  const sub = await prisma.subscription.findFirst({
    where: { portalySubscriptionId: subscriptionId, userId: session.user.id },
  });
  if (!sub) {
    return NextResponse.json({ error: '找不到訂閱' }, { status: 404 });
  }

  try {
    await cancelSubscription(subscriptionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '操作失敗，請稍後再試';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
