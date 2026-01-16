/**
 * Custom Error Classes for Clipwise
 * 自訂錯誤類別，提供結構化的錯誤處理
 */

import { ErrorCodes, type ErrorCode } from '@/types';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

/**
 * Validation Error - for invalid input data
 */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Unauthorized Error - for authentication failures
 */
export class UnauthorizedError extends ApiError {
  constructor(message = '請先登入') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Not Found Error - for missing resources
 */
export class NotFoundError extends ApiError {
  constructor(resource = '資源') {
    super(ErrorCodes.NOT_FOUND, `找不到指定的${resource}`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Invalid URL Error - for SSRF protection
 */
export class InvalidUrlError extends ApiError {
  constructor(message = '不允許存取此網址（安全性限制）') {
    super(ErrorCodes.INVALID_URL, message, 422);
    this.name = 'InvalidUrlError';
  }
}

/**
 * Content Too Large Error
 */
export class ContentTooLargeError extends ApiError {
  constructor(maxSize = '5MB') {
    super(ErrorCodes.CONTENT_TOO_LARGE, `網頁內容超過大小限制（${maxSize}）`, 413);
    this.name = 'ContentTooLargeError';
  }
}

/**
 * Unsupported Content Type Error
 */
export class UnsupportedContentTypeError extends ApiError {
  constructor() {
    super(ErrorCodes.UNSUPPORTED_CONTENT_TYPE, '僅支援 HTML 網頁', 415);
    this.name = 'UnsupportedContentTypeError';
  }
}

/**
 * Rate Limit Error - for too many requests
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super(ErrorCodes.RATE_LIMITED, '請求過於頻繁，請稍後再試', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * AI Quota Exceeded Error
 */
export class AiQuotaExceededError extends ApiError {
  constructor(dailyLimit = 20) {
    super(ErrorCodes.AI_QUOTA_EXCEEDED, `今日 AI 處理配額已用完（${dailyLimit} 次/日）`, 429);
    this.name = 'AiQuotaExceededError';
  }
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): Response {
  if (isApiError(error)) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle unknown errors
  console.error('Unexpected error:', error);
  return Response.json(
    {
      code: ErrorCodes.INTERNAL_ERROR,
      message: '系統發生錯誤，請稍後再試',
    },
    { status: 500 }
  );
}
