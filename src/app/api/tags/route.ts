/**
 * T083: GET /api/tags - 標籤列表端點
 * POST /api/tags - 建立新標籤
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserTags, createTag, searchTags } from '@/services/tag.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let tags;
    if (query) {
      // Search tags
      tags = await searchTags(session.user.id, query, Math.min(limit, 50));
    } else {
      // Get all tags with count
      tags = await getUserTags(session.user.id);
    }

    return NextResponse.json({
      tags: tags.map((tag) => {
        const tagWithCount = tag as typeof tag & { _count?: { bookmarks?: number } };
        return {
          id: tag.id,
          name: tag.name,
          count: tagWithCount._count?.bookmarks ?? 0,
          createdAt: tag.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Failed to get tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Create tag
    const tag = await createTag(session.user.id, name);

    return NextResponse.json(
      {
        tag: {
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tag error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
