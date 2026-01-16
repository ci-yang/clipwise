/**
 * T051: 單元測試 - 標籤正規化
 * 測試標籤的正規化、驗證和去重邏輯
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeTag,
  normalizeTagList,
  validateTag,
  deduplicateTags,
  TAG_CONSTRAINTS,
} from '@/services/tag.service';

describe('Tag Normalization', () => {
  describe('normalizeTag', () => {
    it('should trim whitespace', () => {
      expect(normalizeTag('  技術  ')).toBe('技術');
      expect(normalizeTag('\t程式設計\n')).toBe('程式設計');
    });

    it('should normalize case for English tags', () => {
      expect(normalizeTag('JavaScript')).toBe('javascript');
      expect(normalizeTag('REACT')).toBe('react');
      expect(normalizeTag('TypeScript')).toBe('typescript');
    });

    it('should preserve Chinese characters', () => {
      expect(normalizeTag('人工智能')).toBe('人工智能');
      expect(normalizeTag('前端開發')).toBe('前端開發');
    });

    it('should handle mixed language tags', () => {
      expect(normalizeTag('React 開發')).toBe('react 開發');
      expect(normalizeTag('Next.js 教程')).toBe('next.js 教程');
    });

    it('should remove special characters except allowed ones', () => {
      expect(normalizeTag('tag@name')).toBe('tagname');
      expect(normalizeTag('tag#name')).toBe('tagname');
      expect(normalizeTag('tag-name')).toBe('tag-name'); // hyphen allowed
      expect(normalizeTag('tag.name')).toBe('tag.name'); // dot allowed
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeTag('前端    開發')).toBe('前端 開發');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(normalizeTag('   ')).toBe('');
      expect(normalizeTag('\t\n')).toBe('');
    });
  });

  describe('normalizeTagList', () => {
    it('should normalize all tags in list', () => {
      const tags = ['  JavaScript  ', 'REACT', '前端'];
      const normalized = normalizeTagList(tags);

      expect(normalized).toEqual(['javascript', 'react', '前端']);
    });

    it('should remove empty tags after normalization', () => {
      const tags = ['valid', '   ', 'another'];
      const normalized = normalizeTagList(tags);

      expect(normalized).toEqual(['valid', 'another']);
    });

    it('should remove duplicates', () => {
      const tags = ['React', 'react', 'REACT'];
      const normalized = normalizeTagList(tags);

      expect(normalized).toEqual(['react']);
    });

    it('should limit to maximum tags', () => {
      const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'];
      const normalized = normalizeTagList(tags);

      expect(normalized.length).toBeLessThanOrEqual(TAG_CONSTRAINTS.maxTags);
    });
  });

  describe('validateTag', () => {
    it('should accept valid tags', () => {
      expect(validateTag('技術')).toEqual({ valid: true });
      expect(validateTag('programming')).toEqual({ valid: true });
      expect(validateTag('web-dev')).toEqual({ valid: true });
    });

    it('should reject empty tags', () => {
      const result = validateTag('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject tags that are too short', () => {
      const result = validateTag('a');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('short');
    });

    it('should reject tags that are too long', () => {
      const longTag = 'a'.repeat(TAG_CONSTRAINTS.maxLength + 1);
      const result = validateTag(longTag);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('long');
    });

    it('should reject tags with only numbers', () => {
      const result = validateTag('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('meaningful');
    });

    it('should accept tags with numbers and letters', () => {
      expect(validateTag('web3')).toEqual({ valid: true });
      expect(validateTag('es2024')).toEqual({ valid: true });
    });
  });

  describe('deduplicateTags', () => {
    it('should remove exact duplicates', () => {
      const tags = ['react', 'react', 'vue'];
      const result = deduplicateTags(tags);

      expect(result).toEqual(['react', 'vue']);
    });

    it('should remove case-insensitive duplicates', () => {
      const tags = ['React', 'react', 'REACT', 'Vue'];
      const result = deduplicateTags(tags);

      // Should keep first occurrence
      expect(result).toEqual(['React', 'Vue']);
    });

    it('should preserve order of first occurrence', () => {
      const tags = ['TypeScript', 'javascript', 'TYPESCRIPT'];
      const result = deduplicateTags(tags);

      expect(result).toEqual(['TypeScript', 'javascript']);
    });

    it('should handle empty array', () => {
      expect(deduplicateTags([])).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const tags = ['react', 'vue', 'angular'];
      expect(deduplicateTags(tags)).toEqual(tags);
    });
  });

  describe('TAG_CONSTRAINTS', () => {
    it('should have correct constraint values', () => {
      expect(TAG_CONSTRAINTS.minLength).toBe(2);
      expect(TAG_CONSTRAINTS.maxLength).toBe(30);
      expect(TAG_CONSTRAINTS.maxTags).toBe(5);
    });
  });
});
