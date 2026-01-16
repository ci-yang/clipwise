/**
 * URL Validator with SSRF Protection
 * 驗證 URL 並防止 SSRF 攻擊
 */

import { ErrorCodes, type UrlValidationResult } from '@/types'

// Private/Reserved IP ranges that should be blocked
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  // Loopback
  /^127\./,
  /^localhost$/i,
  // Link-local
  /^169\.254\./,
  // Reserved
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./,
  // IPv6 patterns
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
]

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:']

// Maximum URL length
const MAX_URL_LENGTH = 2048

/**
 * Check if hostname matches a private IP pattern
 */
function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname))
}

/**
 * Resolve hostname to check for DNS rebinding attacks
 * In a real implementation, this would perform DNS lookup
 * For now, we do basic validation
 */
function isValidPublicHost(hostname: string): boolean {
  // Block if it's a private IP pattern
  if (isPrivateHost(hostname)) {
    return false
  }

  // Block internal-looking hostnames
  const internalPatterns = [
    /^internal\./i,
    /^intranet\./i,
    /^private\./i,
    /\.local$/i,
    /\.internal$/i,
    /\.corp$/i,
    /\.home$/i,
  ]

  return !internalPatterns.some((pattern) => pattern.test(hostname))
}

/**
 * Validate URL for security
 */
export function validateUrl(url: string): UrlValidationResult {
  // Check URL length
  if (url.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      error: 'URL 長度超過限制',
      errorCode: ErrorCodes.VALIDATION_ERROR,
    }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return {
      valid: false,
      error: '無效的 URL 格式',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return {
      valid: false,
      error: '僅支援 HTTP 和 HTTPS 協定',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // Check for empty hostname
  if (!parsed.hostname) {
    return {
      valid: false,
      error: '無效的主機名稱',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // SSRF protection - check for private/internal hosts
  if (!isValidPublicHost(parsed.hostname)) {
    return {
      valid: false,
      error: '不允許存取此網址（安全性限制）',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // Check for authentication in URL (potential security issue)
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: 'URL 不應包含認證資訊',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  return { valid: true }
}

/**
 * Sanitize URL - normalize and clean
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove fragment
    parsed.hash = ''
    // Remove auth
    parsed.username = ''
    parsed.password = ''
    return parsed.toString()
  } catch {
    return url
  }
}

/**
 * Check if URL has too many redirects
 */
export function checkRedirectCount(count: number, maxRedirects = 3): boolean {
  return count <= maxRedirects
}
