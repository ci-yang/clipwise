/**
 * T035: Contract 測試 - POST /api/bookmarks
 * 驗證 API 符合 OpenAPI 規格定義
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RateLimitResult } from '@/types';

// Mock auth - must use correct type for NextAuth v5
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock meta-fetcher
vi.mock('@/lib/meta-fetcher', () => ({
  fetchMeta: vi.fn(),
}));

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  checkBookmarkRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
    'X-RateLimit-Reset': '1234567890',
  })),
}));

// Mock url-validator
vi.mock('@/lib/url-validator', () => ({
  validateUrl: vi.fn(),
  normalizeUrl: vi.fn((url: string) => url),
  extractDomain: vi.fn((url: string) => new URL(url).hostname),
}));

// Mock bookmark service
vi.mock('@/services/bookmark.service', () => ({
  createBookmark: vi.fn(),
  checkUrlExists: vi.fn(),
}));

import { checkBookmarkRateLimit } from '@/lib/rate-limit';
import { validateUrl } from '@/lib/url-validator';
import { createBookmark, checkUrlExists } from '@/services/bookmark.service';

describe('POST /api/bookmarks - Contract Tests', () => {
  const mockSession = {
    user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockRateLimitSuccess: RateLimitResult = {
    success: true,
    limit: 10,
    remaining: 9,
    reset: Math.floor(Date.now() / 1000) + 60,
  };

  const mockRateLimitExceeded: RateLimitResult = {
    success: false,
    limit: 10,
    remaining: 0,
    reset: Math.floor(Date.now() / 1000) + 60,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Request Validation', () => {
    it('should require url field in request body', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing url
      });

      // Act - import and call the route handler
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should validate url format', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);
      vi.mocked(validateUrl).mockReturnValue({
        valid: false,
        error: 'Invalid URL format',
      });

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-valid-url' }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(422);
      expect(data.error).toContain('URL');
    });
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitExceeded);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(429);
    });
  });

  describe('Success Response (201)', () => {
    it('should create bookmark and return 201 with correct schema', async () => {
      // Arrange
      const testUrl = 'https://example.com/article';
      const mockBookmark = {
        id: 'bookmark-123',
        userId: 'user-123',
        url: testUrl,
        title: 'Test Article',
        description: 'Test description',
        content: null,
        aiSummary: null,
        aiStatus: 'PENDING' as const,
        thumbnail: 'https://example.com/image.jpg',
        favicon: 'https://example.com/favicon.ico',
        domain: 'example.com',
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);
      vi.mocked(validateUrl).mockReturnValue({ valid: true });
      vi.mocked(checkUrlExists).mockResolvedValue(null);
      vi.mocked(createBookmark).mockResolvedValue(mockBookmark);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);

      // Verify response schema matches OpenAPI spec
      expect(data).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        url: testUrl,
        aiStatus: expect.stringMatching(/^(PENDING|PROCESSING|COMPLETED|FAILED)$/),
      });
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('should return existing bookmark if URL already exists', async () => {
      // Arrange
      const testUrl = 'https://example.com/existing';
      const existingBookmark = {
        id: 'existing-123',
        userId: 'user-123',
        url: testUrl,
        title: 'Existing Bookmark',
        description: null,
        content: null,
        aiSummary: null,
        aiStatus: 'COMPLETED' as const,
        thumbnail: null,
        favicon: null,
        domain: 'example.com',
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);
      vi.mocked(validateUrl).mockReturnValue({ valid: true });
      vi.mocked(checkUrlExists).mockResolvedValue(existingBookmark);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);
      const data = await response.json();

      // Assert - Should return 200 with existing bookmark
      expect(response.status).toBe(200);
      expect(data.id).toBe('existing-123');
    });
  });

  describe('SSRF Protection (422)', () => {
    it('should reject private IP addresses', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);
      vi.mocked(validateUrl).mockReturnValue({
        valid: false,
        error: 'URL points to a private IP address',
      });

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://192.168.1.1/admin' }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(422);
    });

    it('should reject localhost URLs', async () => {
      // Arrange
      mockAuth.mockResolvedValue(mockSession);
      vi.mocked(checkBookmarkRateLimit).mockReturnValue(mockRateLimitSuccess);
      vi.mocked(validateUrl).mockReturnValue({
        valid: false,
        error: 'URL points to localhost',
      });

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://localhost:3000/secret' }),
      });

      // Act
      const { POST } = await import('@/app/api/bookmarks/route');
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(422);
    });
  });
});
