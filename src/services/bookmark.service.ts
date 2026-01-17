/**
 * Bookmark Service - 書籤 CRUD 服務
 * T041: 書籤服務（create, get, update, delete）
 */

import { prisma } from '@/lib/prisma';
import { fetchMetaWithCache } from '@/lib/url-cache';
import { normalizeUrl, extractDomain } from '@/lib/url-validator';
import type { Bookmark, AiStatus, Tag, Prisma } from '@prisma/client';

// Type for tag with isAiGenerated flag (for UI)
export interface TagWithMeta extends Tag {
  isAiGenerated?: boolean;
}

// Type for bookmark with tags
export type BookmarkWithTags = Bookmark & {
  tags: TagWithMeta[];
};

// Input types
export interface CreateBookmarkInput {
  userId: string;
  url: string;
}

export interface UpdateBookmarkInput {
  title?: string;
}

/**
 * 搜尋欄位類型
 * - all: 搜尋所有欄位
 * - title: 只搜尋標題
 * - summary: 只搜尋摘要
 * - tags: 只搜尋標籤
 */
export type SearchField = 'all' | 'title' | 'summary' | 'tags';

export interface ListBookmarksInput {
  userId: string;
  query?: string;
  searchField?: SearchField;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

export interface ListBookmarksResult {
  bookmarks: BookmarkWithTags[];
  nextCursor: string | null;
  totalCount: number;
}

// Helper to transform BookmarkTag[] to Tag[]
function transformBookmarkTags(
  bookmark: Bookmark & { tags: Array<{ tag: Tag }> }
): BookmarkWithTags {
  return {
    ...bookmark,
    tags: bookmark.tags.map((bt) => bt.tag),
  };
}

/**
 * Create a new bookmark
 * Returns existing bookmark if URL already exists for user
 */
export async function createBookmark(input: CreateBookmarkInput): Promise<BookmarkWithTags> {
  const { userId, url } = input;

  // Normalize URL for deduplication
  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(url);

  // Check for existing bookmark with same URL
  const existing = await prisma.bookmark.findFirst({
    where: {
      userId,
      url: normalizedUrl,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (existing) {
    return transformBookmarkTags(existing);
  }

  // Fetch meta information
  let metaInfo = {
    title: null as string | null,
    description: null as string | null,
    thumbnail: null as string | null,
    favicon: null as string | null,
    language: null as 'zh' | 'en' | null,
  };

  try {
    // Use cached meta fetch to avoid redundant requests (FR-033)
    const { meta: fetchedMeta } = await fetchMetaWithCache(url);
    metaInfo = {
      title: fetchedMeta.title,
      description: fetchedMeta.description,
      thumbnail: fetchedMeta.thumbnail,
      favicon: fetchedMeta.favicon,
      language: fetchedMeta.language as 'zh' | 'en' | null,
    };
  } catch (error) {
    console.error('Failed to fetch meta for URL:', url, error);
    // Continue without meta - bookmark will still be created
  }

  // Create bookmark
  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      url: normalizedUrl,
      title: metaInfo.title,
      description: metaInfo.description,
      thumbnail: metaInfo.thumbnail,
      favicon: metaInfo.favicon,
      domain: domain,
      language: metaInfo.language,
      aiStatus: 'PENDING',
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return transformBookmarkTags(bookmark);
}

/**
 * Get a single bookmark by ID
 */
export async function getBookmark(
  bookmarkId: string,
  userId: string
): Promise<BookmarkWithTags | null> {
  const bookmark = await prisma.bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  return bookmark ? transformBookmarkTags(bookmark) : null;
}

/**
 * Update a bookmark
 */
export async function updateBookmark(
  bookmarkId: string,
  userId: string,
  input: UpdateBookmarkInput
): Promise<BookmarkWithTags | null> {
  // Verify ownership
  const existing = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  });

  if (!existing) {
    return null;
  }

  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      title: input.title,
      updatedAt: new Date(),
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  return transformBookmarkTags(bookmark);
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(bookmarkId: string, userId: string): Promise<boolean> {
  // Verify ownership
  const existing = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  });

  if (!existing) {
    return false;
  }

  await prisma.bookmark.delete({
    where: { id: bookmarkId },
  });

  return true;
}

/**
 * List bookmarks with pagination and filtering
 */
export async function listBookmarks(input: ListBookmarksInput): Promise<ListBookmarksResult> {
  const { userId, query, searchField = 'all', tagId, cursor, limit = 20 } = input;
  const take = Math.min(limit, 50); // Max 50 per page

  // Build where clause
  const where: Prisma.BookmarkWhereInput = { userId };

  // Search query based on field type
  if (query) {
    switch (searchField) {
      case 'title':
        where.AND = [{ title: { contains: query, mode: 'insensitive' } }];
        break;
      case 'summary':
        where.AND = [
          {
            OR: [
              { description: { contains: query, mode: 'insensitive' } },
              { aiSummary: { contains: query, mode: 'insensitive' } },
            ],
          },
        ];
        break;
      case 'tags':
        // Search by tag name
        where.tags = {
          some: {
            tag: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        };
        break;
      case 'all':
      default:
        // Search all fields (title, description, aiSummary)
        where.AND = [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { aiSummary: { contains: query, mode: 'insensitive' } },
              // Also include tag name search
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: query, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          },
        ];
        break;
    }
  }

  // Additional tag filter (separate from search)
  if (tagId) {
    if (where.tags) {
      // Already have tag condition from search, add AND
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { tags: { some: { tagId } } }];
      delete where.tags;
    } else {
      where.tags = { some: { tagId } };
    }
  }

  // Get total count
  const totalCount = await prisma.bookmark.count({ where });

  // Fetch bookmarks with cursor pagination
  const rawBookmarks = await prisma.bookmark.findMany({
    where,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
  });

  // Check if there's a next page
  const hasMore = rawBookmarks.length > take;
  const nextCursor = hasMore ? (rawBookmarks[take - 1]?.id ?? null) : null;

  // Remove extra item if present
  if (hasMore) {
    rawBookmarks.pop();
  }

  // Transform to BookmarkWithTags
  const bookmarks = rawBookmarks.map(transformBookmarkTags);

  return {
    bookmarks,
    nextCursor,
    totalCount,
  };
}

/**
 * Update bookmark tags
 */
export async function updateBookmarkTags(
  bookmarkId: string,
  userId: string,
  tagIds: string[]
): Promise<BookmarkWithTags | null> {
  // Verify ownership
  const existing = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  });

  if (!existing) {
    return null;
  }

  // Verify all tags belong to user
  const validTags = await prisma.tag.findMany({
    where: {
      id: { in: tagIds },
      userId,
    },
  });

  const validTagIds = validTags.map((t) => t.id);

  // Delete existing tags and add new ones
  await prisma.bookmarkTag.deleteMany({
    where: { bookmarkId },
  });

  if (validTagIds.length > 0) {
    await prisma.bookmarkTag.createMany({
      data: validTagIds.map((tagId) => ({
        bookmarkId,
        tagId,
      })),
    });
  }

  // Update timestamp and fetch result
  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      updatedAt: new Date(),
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  return transformBookmarkTags(bookmark);
}

/**
 * Update bookmark AI status
 */
export async function updateBookmarkAiStatus(
  bookmarkId: string,
  status: AiStatus,
  aiSummary?: string | null,
  tagIds?: string[]
): Promise<BookmarkWithTags | null> {
  // Update tags if provided
  if (tagIds) {
    await prisma.bookmarkTag.deleteMany({
      where: { bookmarkId },
    });

    if (tagIds.length > 0) {
      await prisma.bookmarkTag.createMany({
        data: tagIds.map((tagId) => ({
          bookmarkId,
          tagId,
        })),
      });
    }
  }

  // Update bookmark
  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      aiStatus: status,
      ...(aiSummary !== undefined && { aiSummary }),
      updatedAt: new Date(),
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  return transformBookmarkTags(bookmark);
}

/**
 * Get bookmarks pending AI processing
 */
export async function getPendingAiBookmarks(limit: number = 10): Promise<BookmarkWithTags[]> {
  const rawBookmarks = await prisma.bookmark.findMany({
    where: {
      aiStatus: 'PENDING',
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  return rawBookmarks.map(transformBookmarkTags);
}

/**
 * Check if URL already exists for user
 */
export async function checkUrlExists(
  userId: string,
  url: string
): Promise<BookmarkWithTags | null> {
  const normalizedUrl = normalizeUrl(url);
  const bookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      url: normalizedUrl,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  return bookmark ? transformBookmarkTags(bookmark) : null;
}
