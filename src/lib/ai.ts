/**
 * Zeabur AI Hub Integration
 * 使用 OpenAI SDK 連接 Zeabur AI Hub 進行 AI 處理
 */

import OpenAI from 'openai';

// Initialize OpenAI client configured for Zeabur AI Hub
// Tokyo endpoint (hnd1) for lower latency in Asia region
const openai = new OpenAI({
  apiKey: process.env.ZEABUR_AI_API_KEY || '',
  baseURL: 'https://hnd1.aihub.zeabur.ai/v1',
});

// AI Model configuration
// gpt-4.1-mini: 1M context window, fast latency, supports tool use
const AI_CONFIG = {
  model: 'gpt-4.1-mini',
  maxTokens: 500,
  temperature: 0.7,
  timeout: 10000, // 10 seconds
};

export interface AiSummaryResult {
  summary: string;
  tags: string[];
  language: 'zh' | 'en';
}

/**
 * Generate summary and tags from content
 */
export async function generateSummaryAndTags(
  content: string,
  title?: string
): Promise<AiSummaryResult> {
  const prompt = buildPrompt(content, title);

  const response = await openai.chat.completions.create({
    model: AI_CONFIG.model,
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
    messages: [
      {
        role: 'system',
        content: `你是一個專業的內容分析助手。請分析使用者提供的網頁內容，並生成：
1. 一段 50-100 字的摘要，使用與原文相同的語言
2. 2-5 個相關標籤，使用與原文相同的語言
3. 判斷內容的主要語言（zh 或 en）

請以 JSON 格式回覆，格式如下：
{
  "summary": "摘要內容",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "language": "zh"
}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = response.choices[0]?.message?.content || '';

  try {
    // Parse JSON response
    const parsed = JSON.parse(responseText) as AiSummaryResult;
    return {
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      language: parsed.language === 'en' ? 'en' : 'zh',
    };
  } catch {
    // If parsing fails, return empty result
    console.error('Failed to parse AI response:', responseText);
    return {
      summary: '',
      tags: [],
      language: 'zh',
    };
  }
}

/**
 * Build prompt for AI processing
 */
function buildPrompt(content: string, title?: string): string {
  // Truncate content to avoid token limits
  const maxContentLength = 3000;
  const truncatedContent =
    content.length > maxContentLength ? content.slice(0, maxContentLength) + '...' : content;

  if (title) {
    return `標題：${title}\n\n內容：${truncatedContent}`;
  }
  return `內容：${truncatedContent}`;
}

/**
 * Generate fallback summary from meta description or content
 */
export function generateFallbackSummary(
  description: string | null,
  content: string | null
): string {
  if (description && description.length > 0) {
    // Use meta description if available
    return description.length > 200 ? description.slice(0, 200) + '...' : description;
  }

  if (content && content.length > 0) {
    // Extract first 200 characters from content
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, ' ')
      .trim();
    return cleanContent.length > 200 ? cleanContent.slice(0, 200) + '...' : cleanContent;
  }

  return '';
}

/**
 * Check if AI service is available
 */
export async function checkAiServiceHealth(): Promise<boolean> {
  if (!process.env.ZEABUR_AI_API_KEY) {
    return false;
  }

  try {
    const response = await openai.models.list();
    return response.data.length > 0;
  } catch {
    return false;
  }
}

export { openai, AI_CONFIG };
