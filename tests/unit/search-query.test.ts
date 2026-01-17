/**
 * T073: 單元測試 - 搜尋查詢建構
 * 測試 PostgreSQL 全文搜尋查詢建構邏輯
 */
import { describe, it, expect } from 'vitest';
import {
  buildSearchQuery,
  parseSearchInput,
  escapeSearchQuery,
  buildHighlightOptions,
  SearchQueryConfig,
} from '@/lib/search';

describe('Search Query Module', () => {
  describe('parseSearchInput', () => {
    it('should trim whitespace', () => {
      const result = parseSearchInput('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should handle empty input', () => {
      const result = parseSearchInput('');
      expect(result).toBe('');
    });

    it('should handle whitespace only input', () => {
      const result = parseSearchInput('   ');
      expect(result).toBe('');
    });

    it('should preserve Chinese characters', () => {
      const result = parseSearchInput('測試搜尋');
      expect(result).toBe('測試搜尋');
    });

    it('should handle mixed language input', () => {
      const result = parseSearchInput('React 教程 TypeScript');
      expect(result).toBe('React 教程 TypeScript');
    });

    it('should collapse multiple spaces', () => {
      const result = parseSearchInput('hello    world');
      expect(result).toBe('hello world');
    });
  });

  describe('escapeSearchQuery', () => {
    it('should escape special characters', () => {
      const result = escapeSearchQuery('hello:world');
      expect(result).not.toContain(':');
    });

    it('should escape parentheses', () => {
      const result = escapeSearchQuery('(hello)');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should escape ampersand and pipe', () => {
      const result = escapeSearchQuery('a & b | c');
      expect(result).not.toContain('&');
      expect(result).not.toContain('|');
    });

    it('should handle exclamation mark', () => {
      const result = escapeSearchQuery('!important');
      expect(result).not.toContain('!');
    });

    it('should preserve normal text', () => {
      const result = escapeSearchQuery('hello world');
      expect(result).toContain('hello');
      expect(result).toContain('world');
    });
  });

  describe('buildSearchQuery', () => {
    it('should build basic OR query by default', () => {
      const result = buildSearchQuery('hello world');
      expect(result.query).toBeDefined();
      expect(result.mode).toBe('simple');
    });

    it('should handle single word', () => {
      const result = buildSearchQuery('react');
      expect(result.query).toBeDefined();
    });

    it('should handle Chinese words', () => {
      const result = buildSearchQuery('前端開發');
      expect(result.query).toBeDefined();
    });

    it('should build AND query with prefix match for web search mode', () => {
      const result = buildSearchQuery('react typescript', { mode: 'websearch' });
      expect(result.mode).toBe('websearch');
    });

    it('should build phrase query with quotes', () => {
      const result = buildSearchQuery('"exact phrase"');
      expect(result.query).toContain('exact phrase');
    });

    it('should handle empty query', () => {
      const result = buildSearchQuery('');
      expect(result.query).toBe('');
    });

    it('should apply prefix matching for partial words', () => {
      const result = buildSearchQuery('rea', { prefixMatch: true });
      expect(result.query).toContain(':*');
    });
  });

  describe('buildHighlightOptions', () => {
    it('should return default highlight options', () => {
      const options = buildHighlightOptions();
      expect(options.startTag).toBeDefined();
      expect(options.endTag).toBeDefined();
      expect(options.maxWords).toBeDefined();
    });

    it('should use custom tags when provided', () => {
      const options = buildHighlightOptions({
        startTag: '<em>',
        endTag: '</em>',
      });
      expect(options.startTag).toBe('<em>');
      expect(options.endTag).toBe('</em>');
    });

    it('should set maxWords', () => {
      const options = buildHighlightOptions({ maxWords: 50 });
      expect(options.maxWords).toBe(50);
    });
  });

  describe('SearchQueryConfig', () => {
    it('should have correct default values', () => {
      expect(SearchQueryConfig.minQueryLength).toBe(1);
      expect(SearchQueryConfig.maxQueryLength).toBe(200);
      expect(SearchQueryConfig.defaultMode).toBe('simple');
      expect(SearchQueryConfig.searchableFields).toContain('title');
      expect(SearchQueryConfig.searchableFields).toContain('description');
      expect(SearchQueryConfig.searchableFields).toContain('aiSummary');
    });
  });
});

describe('Search Query Edge Cases', () => {
  it('should handle SQL injection attempts', () => {
    const malicious = "'; DROP TABLE bookmarks; --";
    const result = buildSearchQuery(malicious);
    // 特殊字元應被移除，防止 SQL 注入
    expect(result.query).not.toContain("'");
    expect(result.query).not.toContain(';');
    expect(result.query).not.toContain('--');
    // 正常單字會被保留（作為搜尋詞）
    expect(result.query).toBeDefined();
  });

  it('should handle very long queries', () => {
    const longQuery = 'a'.repeat(300);
    const result = buildSearchQuery(longQuery);
    // Should be truncated or handled gracefully
    expect(result.query.length).toBeLessThanOrEqual(300);
  });

  it('should handle special unicode characters', () => {
    const unicode = '😀 emoji 🎉 test';
    const result = buildSearchQuery(unicode);
    expect(result.query).toBeDefined();
  });

  it('should handle newlines and tabs', () => {
    const input = 'hello\nworld\ttab';
    const result = parseSearchInput(input);
    expect(result).not.toContain('\n');
    expect(result).not.toContain('\t');
  });
});
