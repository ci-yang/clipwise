/**
 * URL Validator with SSRF Protection
 * 驗證 URL 並防止 SSRF 攻擊
 */

import { ErrorCodes, type UrlValidationResult } from '@/types'

// Private/Reserved IP ranges that should be blocked
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges (10.0.0.0/8)
  /^10\./,
  // IPv4 private ranges (172.16.0.0/12)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  // IPv4 private ranges (192.168.0.0/16)
  /^192\.168\./,
  // Loopback (127.0.0.0/8)
  /^127\./,
  /^localhost$/i,
  // Link-local (169.254.0.0/16)
  /^169\.254\./,
  // Reserved (0.0.0.0/8)
  /^0\./,
  // Broadcast
  /^255\.255\.255\.255$/,
  // Shared address space (100.64.0.0/10)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./,
  // IPv6 loopback
  /^::1$/,
  // IPv6 link-local
  /^fe80:/i,
  // IPv6 unique local
  /^fc00:/i,
  /^fd00:/i,
]

// Cloud metadata endpoints to block
const METADATA_HOSTS = [
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP/Azure metadata
  'metadata.internal',
]

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:']

// Maximum URL length
const MAX_URL_LENGTH = 2048

/**
 * Check if a string is a valid URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return false
  }

  try {
    const parsed = new URL(url)
    // Must be HTTP or HTTPS
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false
    }
    // Must have a valid hostname
    if (!parsed.hostname) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Check if an IP or hostname is private/reserved
 */
export function isPrivateIp(hostOrIp: string): boolean {
  const normalized = hostOrIp.toLowerCase()

  // Check localhost
  if (normalized === 'localhost') {
    return true
  }

  // Check against private IP patterns
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostOrIp))
}

/**
 * Check if hostname matches a private/internal pattern
 */
function isInternalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()

  // Check cloud metadata endpoints
  if (METADATA_HOSTS.includes(lower)) {
    return true
  }

  // Check for private IP
  if (isPrivateIp(hostname)) {
    return true
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

  return internalPatterns.some((pattern) => pattern.test(hostname))
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
      error: 'Invalid URL format',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return {
      valid: false,
      error: 'Only HTTP and HTTPS protocols are allowed',
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

  // Check for localhost specifically
  if (
    parsed.hostname.toLowerCase() === 'localhost' ||
    /^127\./.test(parsed.hostname)
  ) {
    return {
      valid: false,
      error: 'URL points to localhost',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // SSRF protection - check for private/internal hosts
  if (isInternalHost(parsed.hostname)) {
    return {
      valid: false,
      error: 'URL points to a private IP address',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  // Check for authentication in URL (potential security issue)
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: 'URL should not contain authentication info',
      errorCode: ErrorCodes.INVALID_URL,
    }
  }

  return { valid: true }
}

/**
 * Normalize URL for consistent storage and comparison
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Lowercase protocol and hostname
    let normalized = `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}`

    // Remove default ports
    if (
      (parsed.protocol === 'https:' && parsed.port === '443') ||
      (parsed.protocol === 'http:' && parsed.port === '80')
    ) {
      // Don't include port
    } else if (parsed.port) {
      normalized += `:${parsed.port}`
    }

    // Add pathname (preserve case for path)
    let pathname = parsed.pathname
    // Remove trailing slash except for root
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }
    normalized += pathname

    // Sort and add query parameters
    if (parsed.searchParams.toString()) {
      const sortedParams = new URLSearchParams(
        [...parsed.searchParams.entries()].sort((a, b) =>
          a[0].localeCompare(b[0])
        )
      )
      normalized += `?${sortedParams.toString()}`
    }

    // Remove fragment (hash)
    // Fragment is not included

    return normalized
  } catch {
    return url
  }
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

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return null
  }
}
