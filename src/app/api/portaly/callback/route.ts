/**
 * POST /api/portaly/callback — 收 Portaly 的 HMAC callback，更新訂閱狀態。
 * 每次收到都落一筆 CallbackLog：之後分得開「沒送到」與「送到但驗簽掛」。
 */
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyCallback } from '@/lib/portaly-hmac';

export async function POST(request: Request) {
  const secret = process.env.PORTALY_CALLBACK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'callback secret 未設定' }, { status: 500 });
  }

  // 驗簽要用 raw body，不能先 json() 再 stringify（會改變位元組）
  const raw = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const result = verifyCallback({
    secret,
    timestamp: request.headers.get('x-portaly-timestamp'),
    signature: request.headers.get('x-portaly-signature'),
    payload,
  });

  const event = String(payload.event ?? 'unknown');
  const customerEmail =
    typeof payload.customerEmail === 'string' ? payload.customerEmail : null;

  await prisma.callbackLog.create({
    data: {
      event,
      customerEmail,
      signatureOk: result.ok,
      payload: payload as Prisma.InputJsonValue,
    },
  });

  if (!result.ok) {
    // 驗簽失敗回 401，但已落 log，debug 時看得到「有送到、簽掛了」
    return NextResponse.json({ error: `signature: ${result.reason}` }, { status: 401 });
  }

  // 更新訂閱狀態；找不到就略過（可能是別的 merchant 或還沒建）
  const subscriptionId =
    typeof payload.subscriptionId === 'string' ? payload.subscriptionId : null;
  const statusMap: Record<string, string> = {
    'checkout.completed': 'active',
    active: 'active',
    canceled: 'canceled',
  };
  const next = statusMap[event];
  if (subscriptionId && next) {
    await prisma.subscription.updateMany({
      where: { portalySubscriptionId: subscriptionId },
      data: { status: next },
    });
  }

  // 回 200 表示收到；處理失敗才回 5xx 讓 Portaly 重送
  return NextResponse.json({ received: true });
}
