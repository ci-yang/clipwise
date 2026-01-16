/**
 * Bookmark Service - 書籤 CRUD 服務
 * T041: 書籤服務（create, get, update, delete）
 */

import { prisma } from '@/lib/prisma'
import { fetchMeta } from '@/lib/meta-fetcher'
import { normalizeUrl, extractDomain } from '@/lib/url-validator'
import type { Bookmark, AiStatus, Tag } from '@prisma/client'

// Type for bookmark with tags
export type BookmarkWithTags = Bookmark & {
  tags: Tag[]
}

// Input types
export interface CreateBookmarkInput {
  userId: string
  url: string
}

export interface UpdateBookmarkInput {
  title?: string
}

export interface ListBookmarksInput {
  userId: string
  query?: string
  tagId?: string
  cursor?: string
  limit?: number
}

export interface ListBookmarksResult {
  bookmarks: BookmarkWithTags[]
  nextCursor: string | null
  totalCount: number
}

/**
 * Create a new bookmark
 * Returns existing bookmark if URL already exists for user
 */
export async function createBookmark(
  input: CreateBookmarkInput
): Promise<BookmarkWithTags> {
  const { userId, url } = input

  // Normalize URL for deduplication
  const normalizedUrl = normalizeUrl(url)
  const domain = extractDomain(url)

  // Check for existing bookmark with same URL
  const existing = await prisma.bookmark.findFirst({
    where: {
      userId,
      url: normalizedUrl,
    },
    include: {
      tags: true,
    },
  })

  if (existing) {
    return existing
  }

  // Fetch meta information
  let metaInfo = {
    title: null as string | null,
    description: null as string | null,
    thumbnail: null as string | null,
    favicon: null as string | null,
    language: null as 'zh' | 'en' | null,
  }

  try {
    const fetchedMeta = await fetchMeta(url)
    metaInfo = {
      title: fetchedMeta.title,
      description: fetchedMeta.description,
      thumbnail: fetchedMeta.thumbnail,
      favicon: fetchedMeta.favicon,
      language: fetchedMeta.language as 'zh' | 'en' | null,
    }
  } catch (error) {
    console.error('Failed to fetch meta for URL:', url, error)
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
      tags: true,
    },
  })

  return bookmark
}

/**
 * Get a single bookmark by ID
 */
export async function getBookmark(
  bookmarkId: string,
  userId: string
): Promise<BookmarkWithTags | null> {
  return prisma.bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId,
    },
    include: {
      tags: true,
    },
  })
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
  })

  if (!existing) {
    return null
  }

  return prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      title: input.title,
      updatedAt: new Date(),
    },
    include: {
      tags: true,
    },
  })
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(
  bookmarkId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  })

  if (!existing) {
    return false
  }

  await prisma.bookmark.delete({
    where: { id: bookmarkId },
  })

  return true
}

/**
 * List bookmarks with pagination and filtering
 */
export async function listBookmarks(
  input: ListBookmarksInput
): Promise<ListBookmarksResult> {
  const { userId, query, tagId, cursor, limit = 20 } = input
  const take = Math.min(limit, 50) // Max 50 per page

  // Build where clause
  const where: {
    userId: string
    AND?: unknown[]
    tags?: { some: { id: string } }
  } = { userId }

  // Search query (title, description, aiSummary)
  if (query) {
    where.AND = [
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { aiSummary: { contains: query, mode: 'insensitive' } },
        ],
      },
    ]
  }

  // Tag filter
  if (tagId) {
    where.tags = { some: { id: tagId } }
  }

  // Get total count
  const totalCount = await prisma.bookmark.count({ where })

  // Fetch bookmarks with cursor pagination
  const bookmarks = await prisma.bookmark.findMany({
    where,
    include: {
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
  })

  // Check if there's a next page
  const hasMore = bookmarks.length > take
  const nextCursor = hasMore ? bookmarks[take - 1].id : null

  // Remove extra item if present
  if (hasMore) {
    bookmarks.pop()
  }

  return {
    bookmarks,
    nextCursor,
    totalCount,
  }
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
  })

  if (!existing) {
    return null
  }

  // Verify all tags belong to user
  const validTags = await prisma.tag.findMany({
    where: {
      id: { in: tagIds },
      userId,
    },
  })

  const validTagIds = validTags.map((t) => t.id)

  // Update bookmark with new tags
  return prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      tags: {
        set: validTagIds.map((id) => ({ id })),
      },
      updatedAt: new Date(),
    },
    include: {
      tags: true,
    },
  })
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
  const updateData: {
    aiStatus: AiStatus
    aiSummary?: string | null
    tags?: { set: { id: string }[] }
    updatedAt: Date
  } = {
    aiStatus: status,
    updatedAt: new Date(),
  }

  if (aiSummary !== undefined) {
    updateData.aiSummary = aiSummary
  }

  if (tagIds) {
    updateData.tags = {
      set: tagIds.map((id) => ({ id })),
    }
  }

  return prisma.bookmark.update({
    where: { id: bookmarkId },
    data: updateData,
    include: {
      tags: true,
    },
  })
}

/**
 * Get bookmarks pending AI processing
 */
export async function getPendingAiBookmarks(
  limit: number = 10
): Promise<BookmarkWithTags[]> {
  return prisma.bookmark.findMany({
    where: {
      aiStatus: 'PENDING',
    },
    include: {
      tags: true,
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}

/**
 * Check if URL already exists for user
 */
export async function checkUrlExists(
  userId: string,
  url: string
): Promise<BookmarkWithTags | null> {
  const normalizedUrl = normalizeUrl(url)
  return prisma.bookmark.findFirst({
    where: {
      userId,
      url: normalizedUrl,
    },
    include: {
      tags: true,
    },
  })
}
