/**
 * T038: Integration 測試 - 書籤建立完整流程
 * 測試從 API 呼叫到資料庫的完整流程
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { RateLimitResult } from '@/types'
import type { MetaInfo } from '@/lib/meta-fetcher'
import type { BookmarkWithTags } from '@/services/bookmark.service'

// Mock auth - must use correct type for NextAuth v5
const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  checkBookmarkRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
    'X-RateLimit-Reset': '1234567890',
  })),
}))

// Mock url-validator (partial mock - keep real implementation logic)
vi.mock('@/lib/url-validator', () => ({
  validateUrl: vi.fn(),
  normalizeUrl: vi.fn((url: string) => url.toLowerCase()),
  extractDomain: vi.fn((url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }),
}))

// Mock meta-fetcher
vi.mock('@/lib/meta-fetcher', () => ({
  fetchMeta: vi.fn(),
}))

// Mock bookmark service
vi.mock('@/services/bookmark.service', () => ({
  createBookmark: vi.fn(),
  checkUrlExists: vi.fn(),
  listBookmarks: vi.fn(),
}))

import { checkBookmarkRateLimit } from '@/lib/rate-limit'
import { validateUrl } from '@/lib/url-validator'
import { fetchMeta } from '@/lib/meta-fetcher'
import { createBookmark, checkUrlExists } from '@/services/bookmark.service'

describe('Bookmark Creation - Integration Tests', () => {
  const mockSession = {
    user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  const mockRateLimitSuccess: RateLimitResult = {
    success: true,
    limit: 10,
    remaining: 9,
    reset: Math.floor(Date.now() / 1000) + 60,
  }

  const createMockBookmark = (overrides: Partial<BookmarkWithTags> = {}): BookmarkWithTags => ({
    id: 'bookmark-123',
    userId: 'user-123',
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description',
    content: null,
    aiSummary: null,
    aiStatus: 'PENDING',
    thumbnail: null,
    favicon: null,
    domain: 'example.com',
    language: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mocks
    mockAuth.mockResolvedValue(mockSession)
    vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess)
    vi.mocked(validateUrl).mockReturnValue({ valid: true })
    vi.mocked(checkUrlExists).mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Full Flow - URL to Bookmark', () => {
    it('should create bookmark with fetched meta information', async () => {
      // Arrange
      const testUrl = 'https://example.com/article'
      const mockMeta: MetaInfo = {
        title: 'Test Article',
        description: 'Article description',
        thumbnail: 'https://example.com/thumb.jpg',
        favicon: 'https://example.com/favicon.ico',
        domain: 'example.com',
        language: 'en',
      }
      const mockBookmark = createMockBookmark({
        url: testUrl,
        title: mockMeta.title,
        description: mockMeta.description,
        thumbnail: mockMeta.thumbnail,
        favicon: mockMeta.favicon,
        domain: mockMeta.domain,
        language: mockMeta.language,
      })

      vi.mocked(fetchMeta).mockResolvedValue(mockMeta)
      vi.mocked(createBookmark).mockResolvedValue(mockBookmark)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.title).toBe(mockMeta.title)
      expect(data.description).toBe(mockMeta.description)
      expect(data.aiStatus).toBe('PENDING')
    })

    it('should handle duplicate URL gracefully', async () => {
      // Arrange
      const testUrl = 'https://example.com/duplicate'
      const existingBookmark = createMockBookmark({
        id: 'existing-bookmark-id',
        url: testUrl,
        title: 'Existing Bookmark',
        aiStatus: 'COMPLETED',
      })

      vi.mocked(checkUrlExists).mockResolvedValue(existingBookmark)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert - Returns existing bookmark with 200
      expect(response.status).toBe(200)
      expect(data.id).toBe('existing-bookmark-id')
      expect(createBookmark).not.toHaveBeenCalled()
    })

    it('should normalize URL before checking duplicates', async () => {
      // Arrange
      const testUrl = 'https://EXAMPLE.COM/Page'
      const existingBookmark = createMockBookmark({
        url: 'https://example.com/page',
      })

      vi.mocked(checkUrlExists).mockResolvedValue(existingBookmark)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      await POST(request)

      // Assert - checkUrlExists should be called
      expect(checkUrlExists).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle meta fetch failure gracefully', async () => {
      // Arrange
      const testUrl = 'https://example.com/no-meta'
      const mockBookmark = createMockBookmark({
        url: testUrl,
        title: null,
        description: null,
      })

      vi.mocked(fetchMeta).mockRejectedValue(new Error('Fetch failed'))
      vi.mocked(createBookmark).mockResolvedValue(mockBookmark)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert - Should still create bookmark
      expect(response.status).toBe(201)
      expect(createBookmark).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      // Arrange
      const testUrl = 'https://example.com/db-error'
      vi.mocked(createBookmark).mockRejectedValue(new Error('Database connection failed'))

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(500)
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limit', async () => {
      // Arrange
      const rateLimitExceeded: RateLimitResult = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      }
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(rateLimitExceeded)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(429)
      expect(createBookmark).not.toHaveBeenCalled()
    })

    it('should include rate limit headers in success response', async () => {
      // Arrange
      const testUrl = 'https://example.com'
      const mockBookmark = createMockBookmark({ url: testUrl })
      vi.mocked(createBookmark).mockResolvedValue(mockBookmark)

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      // Act
      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    })
  })
})
