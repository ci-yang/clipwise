/**
 * T090: GET/PATCH/DELETE /api/bookmarks/[id]
 * Single bookmark operations: get, update, delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookmarks/[id] - Get single bookmark
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    if (bookmark.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      bookmark: {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        aiSummary: bookmark.aiSummary,
        domain: bookmark.domain,
        favicon: bookmark.favicon,
        thumbnail: bookmark.thumbnail,
        aiStatus: bookmark.aiStatus,
        createdAt: bookmark.createdAt,
        updatedAt: bookmark.updatedAt,
        tags: bookmark.tags.map((bt) => ({
          id: bt.tag.id,
          name: bt.tag.name,
        })),
      },
    });
  } catch (error) {
    console.error('Get bookmark error:', error);
    return NextResponse.json({ error: 'Failed to get bookmark' }, { status: 500 });
  }
}

/**
 * PATCH /api/bookmarks/[id] - Update bookmark
 * Allowed fields: title, description
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    if (existingBookmark.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate update data
    const body = await request.json();
    const allowedFields = ['title', 'description'];
    const updateData: Record<string, string> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update bookmark
    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      bookmark: {
        id: updatedBookmark.id,
        url: updatedBookmark.url,
        title: updatedBookmark.title,
        description: updatedBookmark.description,
        aiSummary: updatedBookmark.aiSummary,
        domain: updatedBookmark.domain,
        favicon: updatedBookmark.favicon,
        thumbnail: updatedBookmark.thumbnail,
        aiStatus: updatedBookmark.aiStatus,
        createdAt: updatedBookmark.createdAt,
        updatedAt: updatedBookmark.updatedAt,
        tags: updatedBookmark.tags.map((bt) => ({
          id: bt.tag.id,
          name: bt.tag.name,
        })),
      },
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}

/**
 * DELETE /api/bookmarks/[id] - Delete bookmark
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    if (existingBookmark.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete bookmark (cascade deletes BookmarkTag entries)
    await prisma.bookmark.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
