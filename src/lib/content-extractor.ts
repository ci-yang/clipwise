/**
 * Content Extractor - 使用 @mozilla/readability 萃取網頁純文字內容
 * 用於 AI 摘要產生
 */

import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

// Maximum content length for AI processing
const MAX_CONTENT_LENGTH = 10000 // ~10KB text

export interface ExtractedContent {
  title: string | null
  content: string | null
  textContent: string | null
  excerpt: string | null
  byline: string | null
  siteName: string | null
  length: number
  language: string | null
}

/**
 * Extract readable content from HTML
 */
export function extractContent(html: string, url: string): ExtractedContent {
  try {
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      // Return minimal extraction if Readability fails
      return extractFallback(html)
    }

    // Clean and truncate text content for AI processing
    const textContent = cleanText(article.textContent || '')
    const truncatedContent = truncateText(textContent, MAX_CONTENT_LENGTH)

    return {
      title: article.title || null,
      content: article.content || null,
      textContent: truncatedContent,
      excerpt: article.excerpt || null,
      byline: article.byline || null,
      siteName: article.siteName || null,
      length: textContent.length,
      language: detectLanguage(truncatedContent),
    }
  } catch (error) {
    console.error('Content extraction failed:', error)
    return extractFallback(html)
  }
}

/**
 * Fallback extraction when Readability fails
 */
function extractFallback(html: string): ExtractedContent {
  try {
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Extract title
    const title =
      doc.querySelector('title')?.textContent?.trim() ||
      doc.querySelector('h1')?.textContent?.trim() ||
      null

    // Extract main content from common containers
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      '.article-body',
    ]

    let textContent = ''
    for (const selector of mainSelectors) {
      const element = doc.querySelector(selector)
      if (element) {
        textContent = cleanText(element.textContent || '')
        if (textContent.length > 100) break
      }
    }

    // If no main content found, use body
    if (!textContent || textContent.length < 100) {
      // Remove script, style, nav, footer, header
      const body = doc.body?.cloneNode(true) as Element
      if (body) {
        const removeSelectors = [
          'script',
          'style',
          'nav',
          'footer',
          'header',
          'aside',
          '.sidebar',
          '.navigation',
          '.menu',
        ]
        removeSelectors.forEach((sel) => {
          body.querySelectorAll(sel).forEach((el) => el.remove())
        })
        textContent = cleanText(body.textContent || '')
      }
    }

    const truncatedContent = truncateText(textContent, MAX_CONTENT_LENGTH)

    return {
      title,
      content: null,
      textContent: truncatedContent,
      excerpt: truncatedContent.slice(0, 200),
      byline: null,
      siteName: null,
      length: textContent.length,
      language: detectLanguage(truncatedContent),
    }
  } catch (error) {
    console.error('Fallback extraction failed:', error)
    return {
      title: null,
      content: null,
      textContent: null,
      excerpt: null,
      byline: null,
      siteName: null,
      length: 0,
      language: null,
    }
  }
}

/**
 * Extract first N characters for AI fallback summary
 */
export function extractFirstNChars(html: string, n: number = 200): string {
  const extracted = extractContent(html, 'https://example.com')
  const text = extracted.textContent || ''
  return text.slice(0, n).trim()
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return (
    text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Trim
      .trim()
  )
}

/**
 * Truncate text to maximum length, preserving word boundaries
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength)
  // Find last space to avoid cutting words
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...'
  }
  return truncated + '...'
}

/**
 * Simple language detection based on character frequency
 */
function detectLanguage(text: string): 'zh' | 'en' | null {
  if (!text || text.length < 10) return null

  // Count Chinese characters
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  // Count ASCII letters
  const asciiLetters = (text.match(/[a-zA-Z]/g) || []).length

  const totalSignificant = chineseChars + asciiLetters
  if (totalSignificant === 0) return null

  const chineseRatio = chineseChars / totalSignificant

  if (chineseRatio > 0.3) return 'zh'
  if (chineseRatio < 0.1 && asciiLetters > 50) return 'en'

  return null
}

/**
 * Check if content is extractable (not too short, not an error page)
 */
export function isExtractable(html: string): boolean {
  try {
    const extracted = extractContent(html, 'https://example.com')
    const textLength = extracted.textContent?.length || 0

    // Minimum content length threshold
    if (textLength < 50) return false

    // Check for common error page indicators
    const errorIndicators = [
      '404',
      'not found',
      'page not found',
      'access denied',
      'forbidden',
      'error',
      '頁面不存在',
      '找不到頁面',
      '存取被拒',
    ]

    const lowerContent = (extracted.textContent || '').toLowerCase()
    const lowerTitle = (extracted.title || '').toLowerCase()

    for (const indicator of errorIndicators) {
      if (
        lowerTitle.includes(indicator) ||
        (lowerContent.includes(indicator) && textLength < 500)
      ) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}
