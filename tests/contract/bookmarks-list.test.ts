/**
 * T066: Contract 測試 - GET /api/bookmarks
 * 測試書籤列表 API 的契約
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiStatus } from '@prisma/client';

// Mock auth - use any to avoid NextAuth type complexity
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock bookmark service
vi.mock('@/services/bookmark.service', () => ({
  listBookmarks: vi.fn(),
  checkUrlExists: vi.fn(),
  createBookmark: vi.fn(),
}));

// Helper to create mock session
const createMockSession = (userId: string) => ({
  user: { id: userId, name: 'Test', email: 'test@example.com' },
  expires: new Date(Date.now() + 86400000).toISOString(),
});

describe('GET /api/bookmarks Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const { auth } = await import('@/lib/auth');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth as any).mockResolvedValue(null);

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should accept authenticated requests', async () => {
      const { auth } = await import('@/lib/auth');
      const { listBookmarks } = await import('@/services/bookmark.service');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth as any).mockResolvedValue(createMockSession('user-1'));

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Response Format', () => {
    beforeEach(async () => {
      const { auth } = await import('@/lib/auth');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth as any).mockResolvedValue(createMockSession('user-1'));
    });

    it('should return bookmarks array with correct structure', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      const mockBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        description: 'An example site',
        aiSummary: 'AI generated summary',
        aiStatus: AiStatus.COMPLETED,
        thumbnail: 'https://example.com/thumb.jpg',
        favicon: 'https://example.com/favicon.ico',
        domain: 'example.com',
        content: null,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [
          {
            id: 'tag-1',
            name: 'tech',
            userId: 'user-1',
            nameLower: 'tech',
            color: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [mockBookmark],
        nextCursor: null,
        totalCount: 1,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toBeInstanceOf(Array);
      expect(data.data[0]).toMatchObject({
        id: 'bookmark-1',
        url: 'https://example.com',
        title: 'Example',
      });
      expect(data.totalCount).toBe(1);
      expect(data.nextCursor).toBeNull();
    });

    it('should return empty array when no bookmarks', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toEqual([]);
      expect(data.totalCount).toBe(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      const { auth } = await import('@/lib/auth');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth as any).mockResolvedValue(createMockSession('user-1'));
    });

    it('should pass cursor parameter to service', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks?cursor=abc123');
      await GET(request);

      expect(listBookmarks).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'abc123' }));
    });

    it('should pass limit parameter to service', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks?limit=10');
      await GET(request);

      expect(listBookmarks).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    });

    it('should return 400 for invalid limit', async () => {
      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks?limit=100');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return nextCursor when more items exist', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: 'next-cursor-id',
        totalCount: 50,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks');
      const response = await GET(request);

      const data = await response.json();
      expect(data.nextCursor).toBe('next-cursor-id');
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      const { auth } = await import('@/lib/auth');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth as any).mockResolvedValue(createMockSession('user-1'));
    });

    it('should pass search query to service', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks?q=react');
      await GET(request);

      expect(listBookmarks).toHaveBeenCalledWith(expect.objectContaining({ query: 'react' }));
    });

    it('should pass tagId filter to service', async () => {
      const { listBookmarks } = await import('@/services/bookmark.service');

      vi.mocked(listBookmarks).mockResolvedValue({
        bookmarks: [],
        nextCursor: null,
        totalCount: 0,
      });

      const { GET } = await import('@/app/api/bookmarks/route');
      const request = new Request('http://localhost:3000/api/bookmarks?tagId=tag-1');
      await GET(request);

      expect(listBookmarks).toHaveBeenCalledWith(expect.objectContaining({ tagId: 'tag-1' }));
    });
  });
});
