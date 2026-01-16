/**
 * T074: 整合測試 - 全文搜尋效能
 * 測試搜尋功能的正確性和效能
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSearchQuery, parseSearchInput, validateSearchQuery } from '@/lib/search';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe('Search Integration Tests', () => {
  describe('Search Query Building', () => {
    it('should build valid query for simple search', () => {
      const result = buildSearchQuery('react tutorial');
      expect(result.query).toBeDefined();
      expect(result.mode).toBe('simple');
    });

    it('should build valid query for Chinese search', () => {
      const result = buildSearchQuery('前端開發教程');
      expect(result.query).toBeDefined();
      expect(result.query).toContain('前端開發教程');
    });

    it('should build valid query for websearch mode', () => {
      const result = buildSearchQuery('react typescript', { mode: 'websearch' });
      expect(result.query).toContain('&');
    });

    it('should handle prefix matching', () => {
      const result = buildSearchQuery('rea', { prefixMatch: true });
      expect(result.query).toContain(':*');
    });
  });

  describe('Search Input Validation', () => {
    it('should accept valid search queries', () => {
      const result = validateSearchQuery('valid search');
      expect(result.valid).toBe(true);
    });

    it('should accept empty query', () => {
      const result = validateSearchQuery('');
      expect(result.valid).toBe(true);
    });

    it('should reject queries exceeding max length', () => {
      const longQuery = 'a'.repeat(201);
      const result = validateSearchQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('200');
    });
  });

  describe('Search Performance Considerations', () => {
    it('should handle typical search query length efficiently', () => {
      const start = performance.now();

      // Simulate multiple query builds
      for (let i = 0; i < 100; i++) {
        buildSearchQuery('react typescript tutorial guide');
      }

      const duration = performance.now() - start;

      // Should complete 100 query builds in under 50ms
      expect(duration).toBeLessThan(50);
    });

    it('should efficiently parse various input formats', () => {
      const inputs = [
        'simple query',
        '前端開發',
        'React TypeScript Next.js',
        '"exact phrase match"',
        'a'.repeat(100),
      ];

      const start = performance.now();

      for (const input of inputs) {
        for (let i = 0; i < 20; i++) {
          parseSearchInput(input);
          buildSearchQuery(input);
        }
      }

      const duration = performance.now() - start;

      // Should complete all operations in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Search Query Escaping', () => {
    it('should safely escape user input', () => {
      const maliciousInputs = [
        "'; DROP TABLE --",
        '<script>alert(1)</script>',
        'normal & special | characters',
        'test:value',
        'hello!world',
      ];

      for (const input of maliciousInputs) {
        const result = buildSearchQuery(input);
        // Should not throw and should return a defined query
        expect(result.query).toBeDefined();
        // Should not contain dangerous characters
        expect(result.query).not.toContain("'");
        expect(result.query).not.toContain('<');
        expect(result.query).not.toContain('>');
      }
    });
  });
});

describe('Search Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have search module exported correctly', async () => {
    const searchModule = await import('@/lib/search');
    expect(searchModule.buildSearchQuery).toBeDefined();
    expect(searchModule.parseSearchInput).toBeDefined();
    expect(searchModule.escapeSearchQuery).toBeDefined();
    expect(searchModule.validateSearchQuery).toBeDefined();
    expect(searchModule.highlightText).toBeDefined();
    expect(searchModule.extractSearchTerms).toBeDefined();
  });
});
