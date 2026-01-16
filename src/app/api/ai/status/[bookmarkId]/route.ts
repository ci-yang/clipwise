/**
 * T057: GET /api/ai/status/[bookmarkId] - AI 狀態查詢端點
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAiStatus } from '@/services/ai.service';
import { checkAiQuota, getRateLimitHeaders } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ bookmarkId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookmarkId } = await context.params;

    if (!bookmarkId) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    // Get AI status
    const status = await getAiStatus(bookmarkId, session.user.id);

    if (!status) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    // Get quota info
    const quotaInfo = checkAiQuota(session.user.id);

    return NextResponse.json(
      {
        bookmarkId,
        aiStatus: status.status,
        aiSummary: status.summary,
        quota: {
          limit: quotaInfo.limit,
          remaining: quotaInfo.remaining,
          resetAt: new Date(quotaInfo.reset * 1000).toISOString(),
        },
      },
      {
        headers: getRateLimitHeaders(quotaInfo),
      }
    );
  } catch (error) {
    console.error('AI status error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI status' },
      { status: 500 }
    );
  }
}
