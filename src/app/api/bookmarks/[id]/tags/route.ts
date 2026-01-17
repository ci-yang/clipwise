/**
 * T091: PUT /api/bookmarks/[id]/tags
 * Update bookmark tags (replace all tags)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeTagName, findOrCreateTag } from '@/services/tag.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/bookmarks/[id]/tags - Replace all tags
 * Body: { tags: string[] } - Array of tag names
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    const body = await request.json();
    const { tags: tagNames } = body;

    if (!Array.isArray(tagNames)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }

    // Normalize and deduplicate tag names
    const normalizedTags = [...new Set(tagNames.map(normalizeTagName).filter(Boolean))];

    // Transaction: delete old tags and create new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing bookmark-tag relations
      await tx.bookmarkTag.deleteMany({
        where: { bookmarkId: id },
      });

      // Find or create tags and create relations
      const tagRecords = await Promise.all(
        normalizedTags.map((name) => findOrCreateTag(session.user!.id, name, tx))
      );

      // Create bookmark-tag relations
      if (tagRecords.length > 0) {
        await tx.bookmarkTag.createMany({
          data: tagRecords.map((tag) => ({
            bookmarkId: id,
            tagId: tag.id,
            isAiGenerated: false, // Manual tags are not AI generated
          })),
          skipDuplicates: true,
        });
      }

      // Fetch updated bookmark with tags
      return tx.bookmark.findUnique({
        where: { id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
    }

    return NextResponse.json({
      bookmark: {
        id: result.id,
        tags: result.tags.map((bt) => ({
          id: bt.tag.id,
          name: bt.tag.name,
          isAiGenerated: 'isAiGenerated' in bt ? bt.isAiGenerated : false,
        })),
      },
    });
  } catch (error) {
    console.error('Update bookmark tags error:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}
