/**
 * T060: 標籤服務（create, get, normalize）
 * T061: 標籤正規化邏輯（Case-insensitive, trim）
 */

import { prisma } from '@/lib/prisma';
import type { Tag } from '@prisma/client';

export const TAG_CONSTRAINTS = {
  minLength: 2,
  maxLength: 30,
  maxTags: 5,
} as const;

export interface TagValidationResult {
  valid: boolean;
  error?: string;
}

export interface TagWithCount extends Tag {
  _count?: {
    bookmarks: number;
  };
}

/**
 * Normalize a single tag
 * - Trim whitespace
 * - Convert to lowercase for English
 * - Remove special characters except hyphen and dot
 * - Collapse multiple spaces
 */
export function normalizeTag(tag: string): string {
  let normalized = tag.trim();

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Remove special characters except allowed ones (hyphen, dot, space)
  normalized = normalized.replace(/[^a-z0-9\u4e00-\u9fa5\s\-\.]/g, '');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Normalize a list of tags
 * - Normalize each tag
 * - Remove empty tags
 * - Remove duplicates
 * - Limit to maxTags
 */
export function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const normalizedTag = normalizeTag(tag);
    if (normalizedTag && !seen.has(normalizedTag)) {
      seen.add(normalizedTag);
      normalized.push(normalizedTag);
    }

    if (normalized.length >= TAG_CONSTRAINTS.maxTags) {
      break;
    }
  }

  return normalized;
}

/**
 * Validate a single tag
 */
export function validateTag(tag: string): TagValidationResult {
  const normalized = normalizeTag(tag);

  if (!normalized) {
    return { valid: false, error: 'Tag cannot be empty' };
  }

  if (normalized.length < TAG_CONSTRAINTS.minLength) {
    return { valid: false, error: `Tag too short (min ${TAG_CONSTRAINTS.minLength} characters)` };
  }

  if (normalized.length > TAG_CONSTRAINTS.maxLength) {
    return { valid: false, error: `Tag too long (max ${TAG_CONSTRAINTS.maxLength} characters)` };
  }

  // Check if tag contains only numbers
  if (/^\d+$/.test(normalized)) {
    return { valid: false, error: 'Tag must contain meaningful characters, not just numbers' };
  }

  return { valid: true };
}

/**
 * Deduplicate tags (case-insensitive)
 * Preserves the first occurrence
 */
export function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    if (!seen.has(lowerTag)) {
      seen.add(lowerTag);
      result.push(tag);
    }
  }

  return result;
}

/**
 * Create a new tag for a user
 */
export async function createTag(userId: string, name: string): Promise<Tag> {
  const normalizedName = normalizeTag(name);
  const validation = validateTag(normalizedName);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return prisma.tag.upsert({
    where: {
      userId_nameLower: {
        nameLower: normalizedName,
        userId,
      },
    },
    create: {
      name: name.trim(),
      nameLower: normalizedName,
      userId,
    },
    update: {},
  });
}

/**
 * Get all tags for a user with bookmark count
 */
export async function getUserTags(userId: string): Promise<TagWithCount[]> {
  return prisma.tag.findMany({
    where: { userId },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
    orderBy: [{ bookmarks: { _count: 'desc' } }, { name: 'asc' }],
  });
}

/**
 * Get a single tag by ID
 */
export async function getTagById(tagId: string, userId: string): Promise<Tag | null> {
  return prisma.tag.findFirst({
    where: {
      id: tagId,
      userId,
    },
  });
}

/**
 * Get tags by names for a user
 */
export async function getTagsByNames(userId: string, names: string[]): Promise<Tag[]> {
  const normalizedNames = names.map(normalizeTag).filter(Boolean);

  return prisma.tag.findMany({
    where: {
      userId,
      name: { in: normalizedNames },
    },
  });
}

/**
 * Create multiple tags (if not exist) and return all tag IDs
 */
export async function createOrGetTags(userId: string, names: string[]): Promise<string[]> {
  const normalizedNames = normalizeTagList(names);
  const tagIds: string[] = [];

  for (const name of normalizedNames) {
    const validation = validateTag(name);
    if (!validation.valid) continue;

    const tag = await prisma.tag.upsert({
      where: {
        userId_nameLower: {
          nameLower: name,
          userId,
        },
      },
      create: {
        name,
        nameLower: name,
        userId,
      },
      update: {},
    });

    tagIds.push(tag.id);
  }

  return tagIds;
}

/**
 * Update tag name
 */
export async function updateTag(
  tagId: string,
  userId: string,
  newName: string
): Promise<Tag | null> {
  // Verify ownership
  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });

  if (!existing) {
    return null;
  }

  const normalizedName = normalizeTag(newName);
  const validation = validateTag(normalizedName);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check if new name already exists
  const duplicate = await prisma.tag.findFirst({
    where: {
      name: normalizedName,
      userId,
      id: { not: tagId },
    },
  });

  if (duplicate) {
    throw new Error('Tag with this name already exists');
  }

  return prisma.tag.update({
    where: { id: tagId },
    data: { name: normalizedName },
  });
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string, userId: string): Promise<boolean> {
  // Verify ownership
  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });

  if (!existing) {
    return false;
  }

  // Delete tag (BookmarkTag relations will be cascade deleted)
  await prisma.tag.delete({
    where: { id: tagId },
  });

  return true;
}

/**
 * Merge tags: move all bookmarks from source tag to target tag, then delete source
 */
export async function mergeTags(
  sourceTagId: string,
  targetTagId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership of both tags
  const [sourceTag, targetTag] = await Promise.all([
    prisma.tag.findFirst({ where: { id: sourceTagId, userId } }),
    prisma.tag.findFirst({ where: { id: targetTagId, userId } }),
  ]);

  if (!sourceTag || !targetTag) {
    return false;
  }

  // Get all bookmarks with source tag
  const sourceBookmarkTags = await prisma.bookmarkTag.findMany({
    where: { tagId: sourceTagId },
  });

  // Add target tag to each bookmark (if not already present)
  for (const bt of sourceBookmarkTags) {
    const existing = await prisma.bookmarkTag.findFirst({
      where: {
        bookmarkId: bt.bookmarkId,
        tagId: targetTagId,
      },
    });

    if (!existing) {
      await prisma.bookmarkTag.create({
        data: {
          bookmarkId: bt.bookmarkId,
          tagId: targetTagId,
        },
      });
    }
  }

  // Delete source tag (cascades to bookmarkTags)
  await prisma.tag.delete({
    where: { id: sourceTagId },
  });

  return true;
}

/**
 * Search tags by name prefix
 */
export async function searchTags(
  userId: string,
  query: string,
  limit: number = 10
): Promise<Tag[]> {
  const normalizedQuery = normalizeTag(query);

  return prisma.tag.findMany({
    where: {
      userId,
      name: {
        contains: normalizedQuery,
        mode: 'insensitive',
      },
    },
    orderBy: {
      name: 'asc',
    },
    take: limit,
  });
}

/**
 * Alias for normalizeTag for better API naming
 */
export const normalizeTagName = normalizeTag;

/**
 * Alias for getUserTags for tags page
 */
export const getTagsWithCount = getUserTags;

/**
 * Find or create a tag within a transaction
 */
export async function findOrCreateTag(
  userId: string,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
): Promise<Tag> {
  const db = tx || prisma;
  const normalizedName = normalizeTag(name);

  // Try to find existing tag
  const existing = await db.tag.findFirst({
    where: {
      userId,
      nameLower: normalizedName,
    },
  });

  if (existing) {
    return existing;
  }

  // Create new tag
  return db.tag.create({
    data: {
      name: name.trim(),
      nameLower: normalizedName,
      userId,
    },
  });
}
