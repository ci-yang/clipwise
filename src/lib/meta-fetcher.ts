/**
 * Meta Fetcher - 網頁 meta 資訊抓取模組
 * 抓取網頁標題、描述、縮圖、favicon 等資訊
 */

import { JSDOM } from 'jsdom'
import { checkRedirectCount } from './url-validator'

// Constants
const FETCH_TIMEOUT_MS = 5000 // 5 seconds
const MAX_CONTENT_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_REDIRECTS = 3
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']

export interface MetaInfo {
  title: string | null
  description: string | null
  thumbnail: string | null
  favicon: string | null
  domain: string
  language: string | null
  canonicalUrl?: string | null
  author?: string | null
  publishedAt?: string | null
  siteName?: string | null
}

/**
 * Fetch and parse meta information from a URL
 */
export async function fetchMeta(url: string): Promise<MetaInfo> {
  const domain = new URL(url).hostname

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let redirectCount = 0

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ClipwiseBot/1.0; +https://clipwise.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    // Check redirect count
    if (response.redirected) {
      // Count redirects by checking the URL chain
      const originalUrl = new URL(url)
      const finalUrl = new URL(response.url)
      if (originalUrl.hostname !== finalUrl.hostname) {
        redirectCount++
      }
    }

    if (!checkRedirectCount(redirectCount, MAX_REDIRECTS)) {
      throw new Error('Too many redirects')
    }

    // Check response status
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type') || ''
    const isHtml = ALLOWED_CONTENT_TYPES.some((type) =>
      contentType.toLowerCase().includes(type)
    )
    if (!isHtml) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    // Check content size
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_SIZE) {
      throw new Error(
        `Content size exceeds limit: ${contentLength} bytes`
      )
    }

    // Get HTML content
    const html = await response.text()

    // Check actual content size
    if (html.length > MAX_CONTENT_SIZE) {
      throw new Error(`Content size exceeds limit: ${html.length} bytes`)
    }

    // Parse and extract meta
    return extractMeta(html, response.url || url)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
    throw new Error('Failed to fetch URL')
  }
}

/**
 * Extract meta information from HTML content
 */
export function extractMeta(html: string, baseUrl: string): MetaInfo {
  const doc = parseHtml(html)
  const domain = new URL(baseUrl).hostname

  // Helper to resolve relative URLs
  const resolveUrl = (relativeUrl: string | null): string | null => {
    if (!relativeUrl) return null
    try {
      return new URL(relativeUrl, baseUrl).href
    } catch {
      return null
    }
  }

  // Extract title (priority: og:title > twitter:title > title tag)
  const ogTitle = getMetaContent(doc, 'property', 'og:title')
  const twitterTitle = getMetaContent(doc, 'name', 'twitter:title')
  const titleTag = doc.querySelector('title')?.textContent?.trim()
  const title = ogTitle || twitterTitle || titleTag || null

  // Extract description (priority: og:description > twitter:description > meta description)
  const ogDescription = getMetaContent(doc, 'property', 'og:description')
  const twitterDescription = getMetaContent(doc, 'name', 'twitter:description')
  const metaDescription = getMetaContent(doc, 'name', 'description')
  const description = ogDescription || twitterDescription || metaDescription || null

  // Extract thumbnail (priority: og:image > twitter:image)
  const ogImage = getMetaContent(doc, 'property', 'og:image')
  const twitterImage = getMetaContent(doc, 'name', 'twitter:image')
  const thumbnail = resolveUrl(ogImage || twitterImage)

  // Extract favicon
  const faviconLink =
    doc.querySelector('link[rel="icon"]') ||
    doc.querySelector('link[rel="shortcut icon"]') ||
    doc.querySelector('link[rel="apple-touch-icon"]')
  const faviconHref = faviconLink?.getAttribute('href')
  const favicon = resolveUrl(faviconHref) || resolveUrl('/favicon.ico')

  // Extract language
  const htmlLang = doc.documentElement?.getAttribute('lang')
  const metaLang = getMetaContent(doc, 'http-equiv', 'content-language')
  const langRaw = htmlLang || metaLang
  const language = langRaw ? normalizeLanguage(langRaw) : null

  // Extract canonical URL
  const canonicalLink = doc.querySelector('link[rel="canonical"]')
  const canonicalUrl = canonicalLink?.getAttribute('href') || null

  // Extract author
  const author = getMetaContent(doc, 'name', 'author')

  // Extract published date
  const publishedAt =
    getMetaContent(doc, 'property', 'article:published_time') ||
    getMetaContent(doc, 'name', 'date') ||
    null

  // Extract site name
  const siteName = getMetaContent(doc, 'property', 'og:site_name')

  return {
    title,
    description,
    thumbnail,
    favicon,
    domain,
    language,
    canonicalUrl,
    author,
    publishedAt,
    siteName,
  }
}

/**
 * Parse HTML string to Document
 */
export function parseHtml(html: string): Document {
  try {
    const dom = new JSDOM(html)
    return dom.window.document
  } catch {
    // Return an empty document if parsing fails
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>')
    return dom.window.document
  }
}

/**
 * Get meta tag content by attribute
 */
function getMetaContent(
  doc: Document,
  attrName: string,
  attrValue: string
): string | null {
  const selector = `meta[${attrName}="${attrValue}"]`
  const meta = doc.querySelector(selector)
  const content = meta?.getAttribute('content')?.trim()
  return content || null
}

/**
 * Normalize language code to 'zh' or 'en'
 */
function normalizeLanguage(lang: string): 'zh' | 'en' | null {
  const lower = lang.toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return null
}
