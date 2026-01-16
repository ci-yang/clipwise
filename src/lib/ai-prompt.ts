/**
 * T053: AI Prompt 模板
 * 提供中英文摘要、標籤產生的 Prompt 模板
 */

export const AiPromptConfig = {
  maxContentLength: 3000,
  minSummaryLength: 10,
  maxSummaryLength: 200,
  minTags: 0,
  maxTags: 5,
} as const;

export interface AiResult {
  summary: string;
  tags: string[];
  language: 'zh' | 'en';
}

/**
 * Build summary generation prompt
 */
export function buildSummaryPrompt(
  content: string,
  title: string | undefined,
  language: 'zh' | 'en'
): string {
  // Truncate content to avoid token limits
  const truncatedContent =
    content.length > AiPromptConfig.maxContentLength
      ? content.slice(0, AiPromptConfig.maxContentLength) + '...'
      : content;

  if (language === 'zh') {
    return `請為以下內容生成一段 50-100 字的中文摘要。摘要應該簡潔明瞭，抓住文章的核心要點。

${title ? `標題：${title}\n\n` : ''}內容：
${truncatedContent}

請直接回覆摘要內容，不要加任何前綴或說明。`;
  }

  return `Please generate a 50-100 word summary for the following content. The summary should be concise and capture the key points.

${title ? `Title: ${title}\n\n` : ''}Content:
${truncatedContent}

Please respond with just the summary, without any prefix or explanation.`;
}

/**
 * Build tag generation prompt
 */
export function buildTagPrompt(content: string, summary: string, language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return `根據以下摘要和內容，生成 2-5 個相關的標籤。標籤應該：
- 簡短（1-3 個字詞）
- 描述主題或類別
- 使用與內容相同的語言

摘要：${summary}

內容片段：${content.slice(0, 500)}

請以 JSON 陣列格式回覆標籤，例如：["標籤1", "標籤2", "標籤3"]`;
  }

  return `Based on the following summary and content, generate 2-5 relevant tags. Tags should be:
- Short (1-3 words)
- Descriptive of the topic or category
- In the same language as the content

Summary: ${summary}

Content excerpt: ${content.slice(0, 500)}

Please respond with tags in JSON array format, e.g.: ["tag1", "tag2", "tag3"]`;
}

/**
 * Build combined prompt for summary and tags
 */
export function buildCombinedPrompt(
  content: string,
  title: string | undefined,
  language: 'zh' | 'en'
): string {
  const truncatedContent =
    content.length > AiPromptConfig.maxContentLength
      ? content.slice(0, AiPromptConfig.maxContentLength) + '...'
      : content;

  const systemPrompt =
    language === 'zh'
      ? `你是一個專業的內容分析助手。請分析使用者提供的網頁內容，並生成：
1. 一段 50-100 字的摘要，使用與原文相同的語言
2. 2-5 個相關標籤，使用與原文相同的語言
3. 判斷內容的主要語言（zh 或 en）

請以 JSON 格式回覆，格式如下：
{
  "summary": "摘要內容",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "language": "zh"
}`
      : `You are a professional content analysis assistant. Please analyze the provided web content and generate:
1. A 50-100 word summary in the same language as the original content
2. 2-5 relevant tags in the same language as the original content
3. Determine the primary language of the content (zh or en)

Please respond in JSON format as follows:
{
  "summary": "Summary content",
  "tags": ["tag1", "tag2", "tag3"],
  "language": "en"
}`;

  const userPrompt = title
    ? `${language === 'zh' ? '標題' : 'Title'}：${title}\n\n${language === 'zh' ? '內容' : 'Content'}：${truncatedContent}`
    : `${language === 'zh' ? '內容' : 'Content'}：${truncatedContent}`;

  return JSON.stringify({ systemPrompt, userPrompt });
}

/**
 * Parse AI response to extract summary and tags
 */
export function parseAiResponse(response: string): AiResult | null {
  try {
    // Remove markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanResponse);

    // Validate and sanitize the result
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((tag: unknown): tag is string => typeof tag === 'string')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0)
          .slice(0, AiPromptConfig.maxTags)
      : [];
    const language = parsed.language === 'en' ? 'en' : 'zh';

    return { summary, tags, language };
  } catch {
    return null;
  }
}

/**
 * Validate AI result meets requirements
 */
export function validateAiResult(result: AiResult | null): boolean {
  if (!result) return false;

  // Check summary
  if (typeof result.summary !== 'string') return false;
  if (result.summary.length < AiPromptConfig.minSummaryLength) return false;

  // Check tags
  if (!Array.isArray(result.tags)) return false;

  // Check language
  if (result.language !== 'zh' && result.language !== 'en') return false;

  return true;
}

/**
 * Detect content language based on character analysis
 */
export function detectLanguage(content: string): 'zh' | 'en' {
  // Count Chinese characters
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseMatches = content.match(chineseRegex);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;

  // Count English words
  const englishRegex = /[a-zA-Z]+/g;
  const englishMatches = content.match(englishRegex);
  const englishCount = englishMatches ? englishMatches.length : 0;

  // If more than 10% Chinese characters, consider it Chinese
  const totalLength = content.length;
  if (chineseCount / totalLength > 0.1) {
    return 'zh';
  }

  // Default to English if more English words
  return englishCount > chineseCount ? 'en' : 'zh';
}
