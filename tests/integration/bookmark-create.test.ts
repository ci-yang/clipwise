/**
 * T038: 整合測試 - 書籤建立流程
 * 測試完整的書籤建立流程（驗證 → 抓取 → 儲存）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock modules
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({ bookmark: { create: vi.fn(), findFirst: vi.fn() } })),
  },
}))

vi.mock('@/lib/meta-fetcher', () => ({
  fetchMeta: vi.fn(),
}))

vi.mock('@/lib/url-validator', () => ({
  validateUrl: vi.fn(),
  normalizeUrl: vi.fn((url) => url.toLowerCase().replace(/\/$/, '')),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchMeta } from '@/lib/meta-fetcher'
import { validateUrl, normalizeUrl } from '@/lib/url-validator'
import { checkRateLimit } from '@/lib/rate-limit'

describe('Bookmark Create Integration', () => {
  const mockSession = {
    user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks for success path
    vi.mocked(auth).mockResolvedValue(mockSession)
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      reset: Date.now() + 60000,
    })
    vi.mocked(validateUrl).mockReturnValue({ valid: true })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Full Create Flow', () => {
    it('should create bookmark with fetched meta data', async () => {
      // Arrange
      const testUrl = 'https://example.com/article'
      const mockMeta = {
        title: 'Test Article',
        description: 'Article description',
        thumbnail: 'https://example.com/image.jpg',
        favicon: 'https://example.com/favicon.ico',
        domain: 'example.com',
        language: 'en',
        canonicalUrl: testUrl,
      }

      const expectedBookmark = {
        id: 'bookmark-123',
        userId: 'user-123',
        url: testUrl,
        title: mockMeta.title,
        description: mockMeta.description,
        aiSummary: null,
        aiStatus: 'PENDING',
        thumbnail: mockMeta.thumbnail,
        favicon: mockMeta.favicon,
        domain: mockMeta.domain,
        language: mockMeta.language,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      }

      vi.mocked(fetchMeta).mockResolvedValue(mockMeta)
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.bookmark.create).mockResolvedValue(expectedBookmark)

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.title).toBe('Test Article')
      expect(data.description).toBe('Article description')
      expect(data.thumbnail).toBe('https://example.com/image.jpg')
      expect(data.aiStatus).toBe('PENDING')

      // Verify meta was fetched
      expect(fetchMeta).toHaveBeenCalledWith(testUrl)

      // Verify bookmark was created with correct data
      expect(prisma.bookmark.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            url: expect.any(String),
            title: 'Test Article',
            aiStatus: 'PENDING',
          }),
        })
      )
    })

    it('should handle meta fetch failure gracefully', async () => {
      // Arrange
      const testUrl = 'https://example.com/unreachable'

      vi.mocked(fetchMeta).mockRejectedValue(new Error('Network error'))
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.bookmark.create).mockResolvedValue({
        id: 'bookmark-456',
        userId: 'user-123',
        url: testUrl,
        title: null, // No title due to fetch failure
        description: null,
        aiSummary: null,
        aiStatus: 'PENDING',
        thumbnail: null,
        favicon: null,
        domain: 'example.com',
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      })

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert - Should still create bookmark even if meta fetch fails
      expect(response.status).toBe(201)
      expect(data.url).toBe(testUrl)
      expect(data.title).toBeNull()
    })

    it('should prevent duplicate bookmarks for same URL', async () => {
      // Arrange
      const testUrl = 'https://example.com/existing'
      const normalizedUrl = 'https://example.com/existing'

      const existingBookmark = {
        id: 'existing-123',
        userId: 'user-123',
        url: normalizedUrl,
        title: 'Existing Bookmark',
        aiStatus: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      }

      vi.mocked(normalizeUrl).mockReturnValue(normalizedUrl)
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(existingBookmark)

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert - Should return existing bookmark
      expect(response.status).toBe(200)
      expect(data.id).toBe('existing-123')

      // Should not create new bookmark
      expect(prisma.bookmark.create).not.toHaveBeenCalled()

      // Should not fetch meta
      expect(fetchMeta).not.toHaveBeenCalled()
    })

    it('should handle URL normalization (trailing slash)', async () => {
      // Arrange
      const testUrl = 'https://example.com/article/'
      const normalizedUrl = 'https://example.com/article'

      vi.mocked(normalizeUrl).mockReturnValue(normalizedUrl)
      vi.mocked(fetchMeta).mockResolvedValue({
        title: 'Article',
        description: null,
        thumbnail: null,
        favicon: null,
        domain: 'example.com',
      })
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.bookmark.create).mockResolvedValue({
        id: 'new-123',
        userId: 'user-123',
        url: normalizedUrl,
        title: 'Article',
        aiStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      })

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.url).toBe(normalizedUrl) // Should store normalized URL
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      // Arrange
      vi.mocked(fetchMeta).mockResolvedValue({
        title: 'Test',
        description: null,
        thumbnail: null,
        favicon: null,
        domain: 'example.com',
      })
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.bookmark.create).mockRejectedValue(
        new Error('Database connection failed')
      )

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/db-error' }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(500)
    })

    it('should validate URL before processing', async () => {
      // Arrange
      vi.mocked(validateUrl).mockReturnValue({
        valid: false,
        error: 'Invalid URL format',
      })

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-valid-url' }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(422)

      // Should not attempt to fetch meta or create bookmark
      expect(fetchMeta).not.toHaveBeenCalled()
      expect(prisma.bookmark.create).not.toHaveBeenCalled()
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should check rate limit before processing', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(429)

      // Should not proceed to validation or fetch
      expect(validateUrl).not.toHaveBeenCalled()
      expect(fetchMeta).not.toHaveBeenCalled()
    })

    it('should include rate limit headers in response', async () => {
      // Arrange
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        reset: Date.now() + 30000,
      })
      vi.mocked(fetchMeta).mockResolvedValue({
        title: 'Test',
        description: null,
        thumbnail: null,
        favicon: null,
        domain: 'example.com',
      })
      vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.bookmark.create).mockResolvedValue({
        id: 'new-123',
        userId: 'user-123',
        url: 'https://example.com',
        title: 'Test',
        aiStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      })

      // Act
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const { POST } = await import('@/app/api/bookmarks/route')
      const response = await POST(request)

      // Assert
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5')
    })
  })
})
