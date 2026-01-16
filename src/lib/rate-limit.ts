/**
 * Rate Limiting Module
 * 使用滑動視窗算法實作請求頻率限制
 */

import type { RateLimitResult } from '@/types'

// In-memory store for rate limiting (for development)
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetAt: number }[]>()

interface RateLimitConfig {
  limit: number
  windowMs: number
}

// Default configurations
export const RATE_LIMIT_CONFIGS = {
  // 書籤建立：每分鐘最多 10 次
  BOOKMARK_CREATE: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // AI 處理配額：每日最多 20 次
  AI_QUOTA: {
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  // 一般 API 請求：每分鐘最多 60 次
  API_GENERAL: {
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
  },
} as const

/**
 * Sliding window rate limiter
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Get existing entries for this key
  let entries = rateLimitStore.get(key) || []

  // Remove expired entries (outside the window)
  entries = entries.filter((entry) => entry.resetAt > windowStart)

  // Count requests in current window
  const requestCount = entries.reduce((sum, entry) => sum + entry.count, 0)

  // Calculate reset time
  const resetAt = now + config.windowMs

  if (requestCount >= config.limit) {
    // Rate limit exceeded
    const oldestEntry = entries[0]
    const resetTime = oldestEntry
      ? oldestEntry.resetAt + config.windowMs
      : resetAt

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(resetTime / 1000),
    }
  }

  // Add new entry
  entries.push({ count: 1, resetAt })
  rateLimitStore.set(key, entries)

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - requestCount - 1,
    reset: Math.ceil(resetAt / 1000),
  }
}

/**
 * Create a rate limit key for user + action
 */
export function createRateLimitKey(
  userId: string,
  action: keyof typeof RATE_LIMIT_CONFIGS
): string {
  return `${action}:${userId}`
}

/**
 * Check bookmark creation rate limit
 */
export function checkBookmarkRateLimit(userId: string): RateLimitResult {
  const key = createRateLimitKey(userId, 'BOOKMARK_CREATE')
  return checkRateLimit(key, RATE_LIMIT_CONFIGS.BOOKMARK_CREATE)
}

/**
 * Check AI quota for a user
 */
export function checkAiQuota(userId: string): RateLimitResult {
  const key = createRateLimitKey(userId, 'AI_QUOTA')
  return checkRateLimit(key, RATE_LIMIT_CONFIGS.AI_QUOTA)
}

/**
 * Increment AI quota usage (call after successful AI processing)
 */
export function incrementAiQuota(userId: string): void {
  const key = createRateLimitKey(userId, 'AI_QUOTA')
  const now = Date.now()
  const entries = rateLimitStore.get(key) || []
  entries.push({
    count: 1,
    resetAt: now + RATE_LIMIT_CONFIGS.AI_QUOTA.windowMs,
  })
  rateLimitStore.set(key, entries)
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Clear rate limit entries (for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
}
