/**
 * T056: POST /api/ai/process/[bookmarkId] - 手動觸發 AI 處理端點
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processBookmarkWithAi, retryAiProcess } from '@/services/ai.service';
import { checkAiQuota, getRateLimitHeaders } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ bookmarkId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Check quota before processing
    const quotaCheck = checkAiQuota(session.user.id);
    if (!quotaCheck.success) {
      return NextResponse.json(
        {
          error: 'AI quota exceeded',
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
          resetAt: new Date(quotaCheck.reset * 1000).toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(quotaCheck),
        }
      );
    }

    // Parse request body for options
    let retry = false;
    try {
      const body = await request.json();
      retry = body.retry === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Process bookmark
    const result = retry
      ? await retryAiProcess(bookmarkId, session.user.id)
      : await processBookmarkWithAi(bookmarkId, session.user.id);

    if (!result.success && result.error) {
      // Determine appropriate status code
      const status = result.error.includes('not found')
        ? 404
        : result.error.includes('Unauthorized')
          ? 403
          : 500;

      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      tags: result.tags,
      usedFallback: result.usedFallback,
      retryCount: result.retryCount,
    });
  } catch (error) {
    console.error('AI process error:', error);
    return NextResponse.json(
      { error: 'Failed to process bookmark with AI' },
      { status: 500 }
    );
  }
}
