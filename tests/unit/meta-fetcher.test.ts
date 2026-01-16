/**
 * T037: 單元測試 - Meta 抓取
 * 測試網頁 meta 資訊抓取功能
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

import { fetchMeta, extractMeta, parseHtml } from '@/lib/meta-fetcher'

describe('Meta Fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchMeta', () => {
    it('should fetch and parse meta information from a URL', async () => {
      // Arrange
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Article Title</title>
          <meta name="description" content="This is a test article description">
          <meta property="og:title" content="OG Title">
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <link rel="icon" href="/favicon.ico">
        </head>
        <body>Content</body>
        </html>
      `

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(htmlContent),
      })

      // Act
      const result = await fetchMeta('https://example.com/article')

      // Assert
      expect(result.title).toBe('OG Title') // OG title takes precedence
      expect(result.description).toBe('This is a test article description')
      expect(result.thumbnail).toBe('https://example.com/og-image.jpg')
      expect(result.domain).toBe('example.com')
    })

    it('should fall back to regular title when OG title is missing', async () => {
      // Arrange
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Regular Title</title>
        </head>
        <body>Content</body>
        </html>
      `

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(htmlContent),
      })

      // Act
      const result = await fetchMeta('https://example.com/page')

      // Assert
      expect(result.title).toBe('Regular Title')
    })

    it('should handle Twitter card meta tags', async () => {
      // Arrange
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Description">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
        </head>
        <body>Content</body>
        </html>
      `

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(htmlContent),
      })

      // Act
      const result = await fetchMeta('https://example.com/tweet')

      // Assert
      expect(result.title).toBe('Twitter Title')
      expect(result.description).toBe('Twitter Description')
      expect(result.thumbnail).toBe('https://example.com/twitter-image.jpg')
    })

    it('should timeout after 5 seconds', async () => {
      // Arrange
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  headers: new Headers({ 'content-type': 'text/html' }),
                  text: () => Promise.resolve('<html></html>'),
                }),
              6000
            )
          })
      )

      // Act & Assert
      await expect(fetchMeta('https://slow-site.com')).rejects.toThrow(
        /timeout|aborted/i
      )
    }, 10000)

    it('should reject non-HTML content types', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      })

      // Act & Assert
      await expect(fetchMeta('https://api.example.com/data')).rejects.toThrow(
        /content type/i
      )
    })

    it('should handle HTTP errors', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      // Act & Assert
      await expect(
        fetchMeta('https://example.com/not-found')
      ).rejects.toThrow(/404/)
    })

    it('should limit redirects to 3', async () => {
      // Arrange
      let redirectCount = 0
      mockFetch.mockImplementation(() => {
        redirectCount++
        if (redirectCount <= 4) {
          return Promise.resolve({
            ok: true,
            status: 302,
            redirected: true,
            url: `https://example.com/redirect-${redirectCount}`,
            headers: new Headers({
              'content-type': 'text/html',
              location: `https://example.com/redirect-${redirectCount + 1}`,
            }),
            text: () => Promise.resolve(''),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: () => Promise.resolve('<html></html>'),
        })
      })

      // Act & Assert
      await expect(
        fetchMeta('https://example.com/redirect-loop')
      ).rejects.toThrow(/redirect/i)
    })

    it('should enforce 5MB content size limit', async () => {
      // Arrange
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
          'content-length': String(largeContent.length),
        }),
        text: () => Promise.resolve(largeContent),
      })

      // Act & Assert
      await expect(fetchMeta('https://example.com/large-page')).rejects.toThrow(
        /size/i
      )
    })
  })

  describe('extractMeta', () => {
    it('should extract canonical URL', () => {
      const html = `
        <html>
        <head>
          <link rel="canonical" href="https://example.com/canonical-url">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com/page')
      expect(meta.canonicalUrl).toBe('https://example.com/canonical-url')
    })

    it('should extract language from html lang attribute', () => {
      const html = `<html lang="zh-TW"><head></head></html>`

      const meta = extractMeta(html, 'https://example.com')
      expect(meta.language).toBe('zh')
    })

    it('should extract language from meta tag', () => {
      const html = `
        <html>
        <head>
          <meta http-equiv="content-language" content="en-US">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com')
      expect(meta.language).toBe('en')
    })

    it('should resolve relative favicon URLs', () => {
      const html = `
        <html>
        <head>
          <link rel="icon" href="/favicon.ico">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com/page')
      expect(meta.favicon).toBe('https://example.com/favicon.ico')
    })

    it('should resolve relative og:image URLs', () => {
      const html = `
        <html>
        <head>
          <meta property="og:image" content="/images/og.jpg">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com/page')
      expect(meta.thumbnail).toBe('https://example.com/images/og.jpg')
    })

    it('should handle missing meta information gracefully', () => {
      const html = `<html><head></head><body>Minimal page</body></html>`

      const meta = extractMeta(html, 'https://example.com')
      expect(meta.title).toBeNull()
      expect(meta.description).toBeNull()
      expect(meta.thumbnail).toBeNull()
    })

    it('should extract author information', () => {
      const html = `
        <html>
        <head>
          <meta name="author" content="John Doe">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com')
      expect(meta.author).toBe('John Doe')
    })

    it('should extract published date', () => {
      const html = `
        <html>
        <head>
          <meta property="article:published_time" content="2026-01-15T10:00:00Z">
        </head>
        </html>
      `

      const meta = extractMeta(html, 'https://example.com')
      expect(meta.publishedAt).toBe('2026-01-15T10:00:00Z')
    })
  })

  describe('parseHtml', () => {
    it('should handle malformed HTML', () => {
      const malformedHtml = `
        <html>
        <head>
          <title>Test
          <meta name="description" content="Test desc">
        </body>
        </html>
      `

      // Should not throw
      expect(() => parseHtml(malformedHtml)).not.toThrow()
    })

    it('should handle empty HTML', () => {
      expect(() => parseHtml('')).not.toThrow()
    })

    it('should handle HTML with special characters', () => {
      const html = `
        <html>
        <head>
          <title>Test &amp; Demo &lt;Special&gt;</title>
        </head>
        </html>
      `

      const doc = parseHtml(html)
      const title = doc.querySelector('title')?.textContent
      expect(title).toBe('Test & Demo <Special>')
    })
  })
})
