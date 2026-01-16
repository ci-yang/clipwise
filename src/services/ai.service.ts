/**
 * T052: AI 服務（摘要產生、標籤建議）
 * T054: AI 重試邏輯（10s 逾時 → 30s 延遲重試）
 * T055: Fallback 策略（meta description / 前 200 字）
 */

import { prisma } from '@/lib/prisma';
import { generateSummaryAndTags, generateFallbackSummary } from '@/lib/ai';
import { validateAiResult, detectLanguage } from '@/lib/ai-prompt';
import { checkAiQuota, incrementAiQuota } from '@/lib/rate-limit';
import type { AiStatus } from '@prisma/client';

export interface AiProcessResult {
  success: boolean;
  summary?: string;
  tags?: string[];
  error?: string;
  usedFallback?: boolean;
  retryCount?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number; // in ms
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  retryDelay: 30000, // 30 seconds
};

/**
 * Process a bookmark with AI to generate summary and tags
 */
export async function processBookmarkWithAi(
  bookmarkId: string,
  userId: string
): Promise<AiProcessResult> {
  // Check AI quota
  const quotaCheck = checkAiQuota(userId);
  if (!quotaCheck.success) {
    return {
      success: false,
      error: `AI quota exceeded. Limit: ${quotaCheck.limit}/day. Resets at: ${new Date(quotaCheck.reset * 1000).toISOString()}`,
    };
  }

  // Get bookmark
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
  });

  if (!bookmark) {
    return {
      success: false,
      error: 'Bookmark not found',
    };
  }

  // Verify ownership
  if (bookmark.userId !== userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Skip if already processed
  if (bookmark.aiStatus === 'COMPLETED') {
    return {
      success: true,
      summary: bookmark.aiSummary || undefined,
    };
  }

  // Get content for AI processing
  const content = bookmark.description || bookmark.title || '';
  if (!content) {
    // No content to process, use fallback
    return applyFallback(bookmarkId, null, null);
  }

  try {
    // Detect language (used by AI processing internally)
    detectLanguage(content);

    // Generate summary and tags with AI
    const aiResult = await generateSummaryAndTags(content, bookmark.title || undefined);

    if (!validateAiResult(aiResult)) {
      // AI result invalid, use fallback
      return applyFallback(bookmarkId, bookmark.description, content);
    }

    // Create or get tags
    const tagIds = await createOrGetTags(userId, aiResult.tags);

    // Update bookmark
    await updateBookmarkAiResult(bookmarkId, 'COMPLETED', aiResult.summary, tagIds);

    // Increment quota
    incrementAiQuota(userId);

    return {
      success: true,
      summary: aiResult.summary,
      tags: aiResult.tags,
    };
  } catch (error) {
    console.error('AI processing failed:', error);
    // AI failed, use fallback
    return applyFallback(bookmarkId, bookmark.description, content);
  }
}

/**
 * Process bookmark with retry logic
 */
export async function retryAiProcess(
  bookmarkId: string,
  userId: string,
  options?: RetryOptions
): Promise<AiProcessResult> {
  const { maxRetries, retryDelay } = { ...DEFAULT_RETRY_OPTIONS, ...options };

  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries (except first attempt)
      if (attempt > 0) {
        await sleep(retryDelay);
        retryCount = attempt;
      }

      const result = await processBookmarkWithAi(bookmarkId, userId);

      if (result.success) {
        return {
          ...result,
          retryCount,
        };
      }

      // If it's a quota error, don't retry
      if (result.error?.includes('quota')) {
        return result;
      }

      lastError = new Error(result.error);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // All retries failed, apply fallback
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
  });

  const result = await applyFallback(
    bookmarkId,
    bookmark?.description || null,
    bookmark?.description || bookmark?.title || null
  );

  return {
    ...result,
    retryCount,
    error: lastError?.message,
  };
}

/**
 * Apply fallback summary strategy
 */
async function applyFallback(
  bookmarkId: string,
  description: string | null,
  content: string | null
): Promise<AiProcessResult> {
  const fallbackSummary = generateFallbackSummary(description, content);

  await updateBookmarkAiResult(bookmarkId, 'FAILED', fallbackSummary, []);

  return {
    success: true,
    summary: fallbackSummary,
    tags: [],
    usedFallback: true,
  };
}

/**
 * Create or get existing tags
 */
async function createOrGetTags(userId: string, tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const normalizedName = name.toLowerCase().trim();
    if (!normalizedName) continue;

    const tag = await prisma.tag.upsert({
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

    tagIds.push(tag.id);
  }

  return tagIds;
}

/**
 * Update bookmark with AI result
 */
async function updateBookmarkAiResult(
  bookmarkId: string,
  status: AiStatus,
  summary: string | null,
  tagIds: string[]
): Promise<void> {
  // Delete existing tags
  await prisma.bookmarkTag.deleteMany({
    where: { bookmarkId },
  });

  // Create new tags
  if (tagIds.length > 0) {
    await prisma.bookmarkTag.createMany({
      data: tagIds.map((tagId) => ({
        bookmarkId,
        tagId,
      })),
    });
  }

  // Update bookmark
  await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      aiStatus: status,
      aiSummary: summary,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get AI processing status for a bookmark
 */
export async function getAiStatus(
  bookmarkId: string,
  userId: string
): Promise<{ status: AiStatus; summary: string | null } | null> {
  const bookmark = await prisma.bookmark.findFirst({
    where: {
      id: bookmarkId,
      userId,
    },
    select: {
      aiStatus: true,
      aiSummary: true,
    },
  });

  if (!bookmark) return null;

  return {
    status: bookmark.aiStatus,
    summary: bookmark.aiSummary,
  };
}

/**
 * Get bookmarks pending AI processing for a user
 */
export async function getPendingBookmarks(userId: string, limit: number = 10) {
  return prisma.bookmark.findMany({
    where: {
      userId,
      aiStatus: 'PENDING',
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
  });
}

/**
 * Process all pending bookmarks for a user (background job)
 */
export async function processPendingBookmarks(userId: string): Promise<number> {
  const pending = await getPendingBookmarks(userId);
  let processed = 0;

  for (const bookmark of pending) {
    const result = await processBookmarkWithAi(bookmark.id, userId);
    if (result.success) {
      processed++;
    }
  }

  return processed;
}

/**
 * Sleep helper for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
