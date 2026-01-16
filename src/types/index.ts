/**
 * Clipwise Type Definitions
 * 集中管理所有 TypeScript 類型定義
 */

import type { Bookmark, Tag, AiStatus } from '@prisma/client'

// Re-export Prisma types
export type { Bookmark, Tag, AiStatus } from '@prisma/client'

// API Response Types
export interface BookmarkWithTags extends Bookmark {
  tags: TagWithCount[]
}

export interface TagWithCount extends Tag {
  _count?: {
    bookmarks: number
  }
}

export interface BookmarkListResponse {
  data: BookmarkWithTags[]
  nextCursor: string | null
  hasMore: boolean
}

export interface TagListResponse {
  data: TagWithCount[]
}

// API Request Types
export interface CreateBookmarkRequest {
  url: string
}

export interface UpdateBookmarkRequest {
  title?: string
}

export interface UpdateBookmarkTagsRequest {
  tagIds: string[]
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string
}

// AI Types
export interface AiStatusResponse {
  status: AiStatus
  aiSummary: string | null
  tags: Tag[]
}

export interface AiProcessResponse {
  message: string
  bookmarkId: string
}

// Error Types
export interface ApiError {
  code: string
  message: string
}

// Error Codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_URL: 'INVALID_URL',
  UNSUPPORTED_CONTENT_TYPE: 'UNSUPPORTED_CONTENT_TYPE',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// Rate Limit Types
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// URL Validation Types
export interface UrlValidationResult {
  valid: boolean
  error?: string
  errorCode?: ErrorCode
}

// Meta Fetch Types
export interface PageMeta {
  title: string | null
  description: string | null
  thumbnail: string | null
  favicon: string | null
  domain: string
  content: string | null
  language: string | null
}

// Session Types (extends next-auth)
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
