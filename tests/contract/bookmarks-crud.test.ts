/**
 * T088: Contract Tests - PATCH/DELETE /api/bookmarks/{id}
 * Tests for bookmark update and delete operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    bookmarkTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('Contract: PATCH/DELETE /api/bookmarks/{id}', () => {
  const mockUserId = 'user-123';
  const mockBookmarkId = 'bookmark-456';
  const mockBookmark = {
    id: mockBookmarkId,
    userId: mockUserId,
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description',
    aiSummary: 'AI generated summary',
    domain: 'example.com',
    favicon: 'https://example.com/favicon.ico',
    thumbnail: null,
    aiStatus: 'COMPLETED',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: [
      { tag: { id: 'tag-1', name: 'React', userId: mockUserId } },
      { tag: { id: 'tag-2', name: 'Next.js', userId: mockUserId } },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as never);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/bookmarks/{id}', () => {
    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const { GET } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/bookmarks/123');
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent bookmark', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(null);

      const { GET } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Bookmark not found');
    });

    it('should return 403 for bookmark owned by another user', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce({
        ...mockBookmark,
        userId: 'other-user',
      } as never);

      const { GET } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should return bookmark details with tags', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(mockBookmark as never);

      const { GET } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.bookmark).toBeDefined();
      expect(data.bookmark.id).toBe(mockBookmarkId);
      expect(data.bookmark.title).toBe('Example Title');
      expect(data.bookmark.tags).toHaveLength(2);
    });
  });

  describe('PATCH /api/bookmarks/{id}', () => {
    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/bookmarks/123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent bookmark', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(null);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(404);
    });

    it('should return 403 for bookmark owned by another user', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce({
        ...mockBookmark,
        userId: 'other-user',
      } as never);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(403);
    });

    it('should update bookmark title successfully', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(mockBookmark as never);
      vi.mocked(prisma.bookmark.update).mockResolvedValueOnce({
        ...mockBookmark,
        title: 'Updated Title',
      } as never);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.bookmark.title).toBe('Updated Title');
    });

    it('should update bookmark description successfully', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(mockBookmark as never);
      vi.mocked(prisma.bookmark.update).mockResolvedValueOnce({
        ...mockBookmark,
        description: 'New description',
      } as never);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: 'New description' }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.bookmark.description).toBe('New description');
    });

    it('should reject invalid update fields', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(mockBookmark as never);
      vi.mocked(prisma.bookmark.update).mockResolvedValueOnce(mockBookmark as never);

      const { PATCH } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ url: 'https://new-url.com' }), // URL should not be updatable
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      // Should either ignore or reject the url field
      expect(response.status).toBe(200);
      // URL should not be in the update call
      expect(prisma.bookmark.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ url: 'https://new-url.com' }),
        })
      );
    });
  });

  describe('DELETE /api/bookmarks/{id}', () => {
    it('should return 401 for unauthenticated requests', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);

      const { DELETE } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest('http://localhost:3000/api/bookmarks/123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent bookmark', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(null);

      const { DELETE } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(404);
    });

    it('should return 403 for bookmark owned by another user', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce({
        ...mockBookmark,
        userId: 'other-user',
      } as never);

      const { DELETE } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(403);
    });

    it('should delete bookmark successfully', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValueOnce(mockBookmark as never);
      vi.mocked(prisma.bookmark.delete).mockResolvedValueOnce(mockBookmark as never);

      const { DELETE } = await import('@/app/api/bookmarks/[id]/route');
      const request = new NextRequest(`http://localhost:3000/api/bookmarks/${mockBookmarkId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockBookmarkId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.bookmark.delete).toHaveBeenCalledWith({
        where: { id: mockBookmarkId },
      });
    });
  });
});
