/**
 * T049: 單元測試 - AI Prompt 產生
 * 測試 AI Prompt 模板和回應解析
 */
import { describe, it, expect } from 'vitest';
import {
  buildSummaryPrompt,
  buildTagPrompt,
  parseAiResponse,
  validateAiResult,
  AiPromptConfig,
} from '@/lib/ai-prompt';

describe('AI Prompt Module', () => {
  describe('buildSummaryPrompt', () => {
    it('should build Chinese prompt for Chinese content', () => {
      const content = '這是一篇關於人工智能的文章，介紹了最新的技術發展。';
      const title = 'AI 技術發展';

      const prompt = buildSummaryPrompt(content, title, 'zh');

      expect(prompt).toContain('摘要');
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('50-100');
    });

    it('should build English prompt for English content', () => {
      const content =
        'This is an article about artificial intelligence and its latest developments.';
      const title = 'AI Technology Developments';

      const prompt = buildSummaryPrompt(content, title, 'en');

      expect(prompt).toContain('summary');
      expect(prompt).toContain(title);
      expect(prompt).toContain(content);
      expect(prompt).toContain('50-100');
    });

    it('should truncate long content', () => {
      const longContent = 'A'.repeat(5000);
      const prompt = buildSummaryPrompt(longContent, 'Title', 'en');

      // Should truncate to maxContentLength (3000)
      expect(prompt.length).toBeLessThan(longContent.length + 500);
      expect(prompt).toContain('...');
    });

    it('should handle missing title', () => {
      const content = 'Some article content here.';
      const prompt = buildSummaryPrompt(content, undefined, 'en');

      expect(prompt).toContain(content);
      expect(prompt).not.toContain('Title:');
    });
  });

  describe('buildTagPrompt', () => {
    it('should build tag generation prompt', () => {
      const content = '這是一篇關於 React 和 TypeScript 的前端開發教程。';
      const summary = '前端開發教程，涵蓋 React 和 TypeScript。';

      const prompt = buildTagPrompt(content, summary, 'zh');

      expect(prompt).toContain('標籤');
      expect(prompt).toContain('2-5');
      expect(prompt).toContain(summary);
    });

    it('should include content context for better tags', () => {
      const content = 'Learn how to build web applications with Next.js and deploy to Vercel.';
      const summary = 'A tutorial on building web apps with Next.js.';

      const prompt = buildTagPrompt(content, summary, 'en');

      expect(prompt).toContain('tags');
      expect(prompt).toContain(summary);
    });
  });

  describe('parseAiResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        summary: '這是一篇很棒的文章',
        tags: ['技術', 'AI', '程式設計'],
        language: 'zh',
      });

      const result = parseAiResponse(response);

      expect(result).not.toBeNull();
      expect(result!.summary).toBe('這是一篇很棒的文章');
      expect(result!.tags).toEqual(['技術', 'AI', '程式設計']);
      expect(result!.language).toBe('zh');
    });

    it('should handle response with markdown code blocks', () => {
      const response = `\`\`\`json
{
  "summary": "A great article about AI",
  "tags": ["technology", "AI", "programming"],
  "language": "en"
}
\`\`\``;

      const result = parseAiResponse(response);

      expect(result).not.toBeNull();
      expect(result!.summary).toBe('A great article about AI');
      expect(result!.tags).toEqual(['technology', 'AI', 'programming']);
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is not JSON';

      const result = parseAiResponse(response);

      expect(result).toBeNull();
    });

    it('should limit tags to maximum 5', () => {
      const response = JSON.stringify({
        summary: 'Test summary',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
        language: 'en',
      });

      const result = parseAiResponse(response);

      expect(result).not.toBeNull();
      expect(result!.tags.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty tags array', () => {
      const response = JSON.stringify({
        summary: 'Test summary',
        tags: [],
        language: 'en',
      });

      const result = parseAiResponse(response);

      expect(result).not.toBeNull();
      expect(result!.tags).toEqual([]);
    });
  });

  describe('validateAiResult', () => {
    it('should validate complete result', () => {
      const result = {
        summary: '這是一段有效的摘要，包含足夠的文字長度以通過驗證',
        tags: ['標籤1', '標籤2'],
        language: 'zh' as const,
      };

      expect(validateAiResult(result)).toBe(true);
    });

    it('should reject empty summary', () => {
      const result = {
        summary: '',
        tags: ['標籤'],
        language: 'zh' as const,
      };

      expect(validateAiResult(result)).toBe(false);
    });

    it('should reject summary that is too short', () => {
      const result = {
        summary: '太短',
        tags: ['標籤'],
        language: 'zh' as const,
      };

      expect(validateAiResult(result)).toBe(false);
    });

    it('should reject invalid tags (non-array)', () => {
      const result = {
        summary: '這是一段有效的摘要文字，長度足夠通過驗證',
        tags: 'not an array' as unknown as string[],
        language: 'zh' as const,
      };

      expect(validateAiResult(result)).toBe(false);
    });

    it('should reject null result', () => {
      expect(validateAiResult(null)).toBe(false);
    });
  });

  describe('AiPromptConfig', () => {
    it('should have correct default values', () => {
      expect(AiPromptConfig.maxContentLength).toBe(3000);
      expect(AiPromptConfig.minSummaryLength).toBe(10);
      expect(AiPromptConfig.maxSummaryLength).toBe(200);
      expect(AiPromptConfig.minTags).toBe(0);
      expect(AiPromptConfig.maxTags).toBe(5);
    });
  });
});
