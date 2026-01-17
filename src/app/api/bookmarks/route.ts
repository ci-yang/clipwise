/**
 * POST /api/bookmarks - 建立書籤
 * GET /api/bookmarks - 取得書籤列表
 *
 * T042: POST /api/bookmarks 端點
 */

import { NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth';
import { validateUrl } from '@/lib/url-validator';
import { checkBookmarkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import {
  createBookmark,
  listBookmarks,
  checkUrlExists,
  type SearchField,
} from '@/services/bookmark.service';
import { processBookmarkWithAi } from '@/services/ai.service';

/**
 * POST /api/bookmarks - Create a new bookmark
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登入，請先登入' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitResult = checkBookmarkRateLimit(userId);

    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset - Math.floor(Date.now() / 1000);
      return NextResponse.json(
        {
          error: '請求過於頻繁，請稍後再試',
          retryAfter: Math.max(1, retryAfter),
        },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(rateLimitResult),
            'Retry-After': String(Math.max(1, retryAfter)),
          },
        }
      );
    }

    // Parse request body
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '無效的請求格式' }, { status: 400 });
    }

    // Validate URL presence
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: '缺少必要欄位：url' }, { status: 400 });
    }

    // Validate URL format and SSRF protection
    const urlValidation = validateUrl(body.url);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || 'URL 驗證失敗' }, { status: 422 });
    }

    // Check if bookmark already exists
    const existingBookmark = await checkUrlExists(userId, body.url);
    if (existingBookmark) {
      return NextResponse.json(existingBookmark, {
        status: 200, // Return 200 for existing
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    // Create bookmark
    const bookmark = await createBookmark({
      userId,
      url: body.url,
    });

    // Trigger AI processing in background (non-blocking)
    // Uses Next.js after() API to run after response is sent
    after(async () => {
      try {
        await processBookmarkWithAi(bookmark.id, userId);
      } catch (error) {
        console.error('Background AI processing failed:', error);
      }
    });

    return NextResponse.json(bookmark, {
      status: 201,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: '建立書籤失敗，請稍後再試' }, { status: 500 });
  }
}

/**
 * GET /api/bookmarks - List bookmarks with pagination
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登入，請先登入' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const searchFieldParam = searchParams.get('field');
    const searchField: SearchField = ['all', 'title', 'summary', 'tags'].includes(
      searchFieldParam || ''
    )
      ? (searchFieldParam as SearchField)
      : 'all';
    const tagId = searchParams.get('tagId') || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: '無效的 limit 參數（1-50）' }, { status: 400 });
    }

    // Get bookmarks
    const result = await listBookmarks({
      userId,
      query,
      searchField,
      tagId,
      cursor,
      limit,
    });

    return NextResponse.json({
      data: result.bookmarks,
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error('Error listing bookmarks:', error);
    return NextResponse.json({ error: '取得書籤列表失敗' }, { status: 500 });
  }
}
