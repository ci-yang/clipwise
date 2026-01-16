/**
 * T036: 單元測試 - URL 驗證
 * 測試 SSRF 防護和 URL 格式驗證
 */
import { describe, it, expect } from 'vitest'
import {
  validateUrl,
  isValidUrl,
  isPrivateIp,
  normalizeUrl,
} from '@/lib/url-validator'

describe('URL Validator', () => {
  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('http://example.com/path')).toBe(true)
      expect(isValidUrl('http://example.com/path?query=1')).toBe(true)
    })

    it('should accept valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('https://subdomain.example.com')).toBe(true)
      expect(isValidUrl('https://example.com:8080/path')).toBe(true)
    })

    it('should reject non-HTTP(S) protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false)
      expect(isValidUrl('file:///etc/passwd')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('   ')).toBe(false)
      expect(isValidUrl('http://')).toBe(false)
    })
  })

  describe('isPrivateIp', () => {
    it('should identify localhost addresses', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true)
      expect(isPrivateIp('127.0.0.2')).toBe(true)
      expect(isPrivateIp('localhost')).toBe(true)
    })

    it('should identify private IPv4 ranges', () => {
      // 10.0.0.0/8
      expect(isPrivateIp('10.0.0.1')).toBe(true)
      expect(isPrivateIp('10.255.255.255')).toBe(true)

      // 172.16.0.0/12
      expect(isPrivateIp('172.16.0.1')).toBe(true)
      expect(isPrivateIp('172.31.255.255')).toBe(true)

      // 192.168.0.0/16
      expect(isPrivateIp('192.168.0.1')).toBe(true)
      expect(isPrivateIp('192.168.255.255')).toBe(true)
    })

    it('should identify link-local addresses', () => {
      expect(isPrivateIp('169.254.0.1')).toBe(true)
      expect(isPrivateIp('169.254.255.254')).toBe(true)
    })

    it('should identify reserved addresses', () => {
      expect(isPrivateIp('0.0.0.0')).toBe(true)
      expect(isPrivateIp('255.255.255.255')).toBe(true)
    })

    it('should allow public IP addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false) // Google DNS
      expect(isPrivateIp('1.1.1.1')).toBe(false) // Cloudflare DNS
      expect(isPrivateIp('142.250.190.46')).toBe(false) // google.com
    })

    it('should handle IPv6 loopback', () => {
      expect(isPrivateIp('::1')).toBe(true)
    })
  })

  describe('validateUrl', () => {
    it('should pass valid public URLs', () => {
      const result = validateUrl('https://example.com/article')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail for invalid URL format', () => {
      const result = validateUrl('not-a-url')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid URL')
    })

    it('should fail for private IP addresses', () => {
      const result = validateUrl('http://192.168.1.1/admin')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('private')
    })

    it('should fail for localhost', () => {
      const result = validateUrl('http://localhost:3000')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('localhost')
    })

    it('should fail for localhost with IP', () => {
      const result = validateUrl('http://127.0.0.1:8080')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('localhost')
    })

    it('should fail for internal cloud metadata URLs', () => {
      // AWS metadata endpoint
      const awsResult = validateUrl('http://169.254.169.254/latest/meta-data/')
      expect(awsResult.valid).toBe(false)

      // GCP metadata endpoint
      const gcpResult = validateUrl('http://metadata.google.internal/')
      expect(gcpResult.valid).toBe(false)
    })

    it('should fail for non-HTTP protocols', () => {
      const result = validateUrl('ftp://ftp.example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('HTTP')
    })
  })

  describe('normalizeUrl', () => {
    it('should remove trailing slashes', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com')
      expect(normalizeUrl('https://example.com/path/')).toBe(
        'https://example.com/path'
      )
    })

    it('should normalize protocol to lowercase', () => {
      expect(normalizeUrl('HTTPS://Example.COM')).toBe('https://example.com')
    })

    it('should preserve path case', () => {
      expect(normalizeUrl('https://example.com/Path/TO/Resource')).toBe(
        'https://example.com/Path/TO/Resource'
      )
    })

    it('should remove default ports', () => {
      expect(normalizeUrl('https://example.com:443/path')).toBe(
        'https://example.com/path'
      )
      expect(normalizeUrl('http://example.com:80/path')).toBe(
        'http://example.com/path'
      )
    })

    it('should preserve non-default ports', () => {
      expect(normalizeUrl('https://example.com:8443/path')).toBe(
        'https://example.com:8443/path'
      )
    })

    it('should sort query parameters', () => {
      expect(normalizeUrl('https://example.com?b=2&a=1')).toBe(
        'https://example.com?a=1&b=2'
      )
    })

    it('should remove fragment identifiers', () => {
      expect(normalizeUrl('https://example.com/page#section')).toBe(
        'https://example.com/page'
      )
    })
  })
})
