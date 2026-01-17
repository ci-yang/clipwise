/**
 * T047b: URL 抓取快取機制
 * FR-033: 同一 URL 的重複抓取實施快取（1 小時內不重複抓取）
 *
 * 使用 Prisma 儲存快取資料，避免短時間內重複抓取相同 URL
 */

import { prisma } from './prisma';
import { fetchMeta, type MetaInfo } from './meta-fetcher';

// Cache duration: 1 hour in milliseconds
const CACHE_DURATION_MS = 60 * 60 * 1000;

export interface CachedMetaResult {
  meta: MetaInfo;
  fromCache: boolean;
  cachedAt?: Date;
}

/**
 * Fetch meta with caching
 * Returns cached data if available and not expired
 */
export async function fetchMetaWithCache(url: string): Promise<CachedMetaResult> {
  // Normalize URL for consistent cache keys
  const normalizedUrl = normalizeUrl(url);

  // Check cache
  const cached = await getCachedMeta(normalizedUrl);
  if (cached) {
    return {
      meta: cached.meta,
      fromCache: true,
      cachedAt: cached.cachedAt,
    };
  }

  // Fetch fresh data
  const meta = await fetchMeta(url);

  // Store in cache
  await setCachedMeta(normalizedUrl, meta);

  return {
    meta,
    fromCache: false,
  };
}

/**
 * Get cached meta data if not expired
 */
async function getCachedMeta(url: string): Promise<{ meta: MetaInfo; cachedAt: Date } | null> {
  try {
    const cached = await prisma.urlCache.findUnique({
      where: { url },
    });

    if (!cached) {
      return null;
    }

    // Check if expired
    const expiresAt = new Date(cached.cachedAt.getTime() + CACHE_DURATION_MS);
    if (new Date() > expiresAt) {
      // Delete expired cache
      await prisma.urlCache.delete({ where: { url } }).catch(() => {
        // Ignore deletion errors
      });
      return null;
    }

    return {
      meta: cached.meta as unknown as MetaInfo,
      cachedAt: cached.cachedAt,
    };
  } catch {
    // Cache lookup failed, proceed without cache
    return null;
  }
}

/**
 * Store meta data in cache
 */
async function setCachedMeta(url: string, meta: MetaInfo): Promise<void> {
  try {
    await prisma.urlCache.upsert({
      where: { url },
      create: {
        url,
        meta: meta as object,
        cachedAt: new Date(),
      },
      update: {
        meta: meta as object,
        cachedAt: new Date(),
      },
    });
  } catch {
    // Cache write failed, continue without caching
    console.warn('[url-cache] Failed to write cache for:', url);
  }
}

/**
 * Normalize URL for consistent cache keys
 * - Remove trailing slashes
 * - Sort query parameters
 * - Remove fragments
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove fragment
    parsed.hash = '';

    // Sort search params
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams();
    const keys = Array.from(params.keys()).sort();
    for (const key of keys) {
      const value = params.get(key);
      if (value !== null) {
        sortedParams.set(key, value);
      }
    }
    parsed.search = sortedParams.toString();

    // Remove trailing slash (except for root)
    let normalized = parsed.toString();
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return url;
  }
}

/**
 * Clear expired cache entries (for maintenance)
 */
export async function clearExpiredCache(): Promise<number> {
  const expiredBefore = new Date(Date.now() - CACHE_DURATION_MS);

  const result = await prisma.urlCache.deleteMany({
    where: {
      cachedAt: {
        lt: expiredBefore,
      },
    },
  });

  return result.count;
}

/**
 * Clear all cache (for testing/admin)
 */
export async function clearAllCache(): Promise<number> {
  const result = await prisma.urlCache.deleteMany({});
  return result.count;
}

/**
 * Check if URL is cached (for debugging)
 */
export async function isCached(url: string): Promise<boolean> {
  const normalizedUrl = normalizeUrl(url);
  const cached = await getCachedMeta(normalizedUrl);
  return cached !== null;
}
