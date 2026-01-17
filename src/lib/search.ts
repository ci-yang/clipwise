/**
 * T075: PostgreSQL 全文搜尋查詢建構
 * 提供搜尋查詢的解析、建構和高亮功能
 */

/**
 * 搜尋設定常數
 */
export const SearchQueryConfig = {
  /** 最小搜尋字數 */
  minQueryLength: 1,
  /** 最大搜尋字數 */
  maxQueryLength: 200,
  /** 預設搜尋模式 */
  defaultMode: 'simple' as const,
  /** 可搜尋的欄位 */
  searchableFields: ['title', 'description', 'aiSummary', 'url', 'domain'] as const,
  /** 高亮標籤 */
  highlightStartTag: '<mark>',
  highlightEndTag: '</mark>',
  /** 高亮摘要最大字數 */
  highlightMaxWords: 35,
};

/**
 * 搜尋模式
 * - simple: 基本 OR 搜尋
 * - websearch: 類似網頁搜尋的 AND 邏輯
 * - phrase: 完全匹配短語
 */
export type SearchMode = 'simple' | 'websearch' | 'phrase';

/**
 * 搜尋查詢結果
 */
export interface SearchQueryResult {
  /** 處理後的查詢字串 */
  query: string;
  /** 搜尋模式 */
  mode: SearchMode;
  /** 原始輸入 */
  originalInput: string;
}

/**
 * 高亮選項
 */
export interface HighlightOptions {
  startTag: string;
  endTag: string;
  maxWords: number;
}

/**
 * 搜尋查詢建構選項
 */
export interface SearchQueryOptions {
  /** 搜尋模式 */
  mode?: SearchMode;
  /** 是否啟用前綴匹配 */
  prefixMatch?: boolean;
}

/**
 * 解析搜尋輸入
 * 清理和標準化使用者輸入
 */
export function parseSearchInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[\n\r\t]/g, ' ') // 移除換行和 tab
    .replace(/\s+/g, ' ') // 合併多個空格
    .trim();
}

/**
 * 跳脫特殊字元
 * 避免 SQL 注入和 tsquery 語法錯誤
 */
export function escapeSearchQuery(query: string): string {
  if (!query) return '';

  // 移除或替換 PostgreSQL tsquery 特殊字元和 SQL 危險字元
  return query
    .replace(/[\\:&|!()'";`<>]/g, ' ') // 移除特殊字元
    .replace(/--/g, ' ') // 移除 SQL 註解
    .replace(/\s+/g, ' ') // 合併空格
    .trim();
}

/**
 * 建構搜尋查詢
 * 將使用者輸入轉換為 PostgreSQL 全文搜尋查詢
 */
export function buildSearchQuery(
  input: string,
  options: SearchQueryOptions = {}
): SearchQueryResult {
  const { mode = SearchQueryConfig.defaultMode, prefixMatch = false } = options;

  const parsed = parseSearchInput(input);

  if (!parsed) {
    return {
      query: '',
      mode,
      originalInput: input,
    };
  }

  // 截斷過長的查詢
  const truncated =
    parsed.length > SearchQueryConfig.maxQueryLength
      ? parsed.slice(0, SearchQueryConfig.maxQueryLength)
      : parsed;

  // 檢測是否為短語搜尋（使用引號包裹）
  const isPhraseSearch = /^".*"$/.test(truncated);

  if (isPhraseSearch) {
    const phrase = truncated.slice(1, -1); // 移除引號
    const escaped = escapeSearchQuery(phrase);
    return {
      query: escaped,
      mode: 'phrase',
      originalInput: input,
    };
  }

  // 跳脫特殊字元
  const escaped = escapeSearchQuery(truncated);

  if (!escaped) {
    return {
      query: '',
      mode,
      originalInput: input,
    };
  }

  // 分割為詞彙
  const words = escaped.split(' ').filter((word) => word.length > 0);

  if (words.length === 0) {
    return {
      query: '',
      mode,
      originalInput: input,
    };
  }

  // 根據模式建構查詢
  let queryString: string;

  switch (mode) {
    case 'websearch':
      // AND 邏輯，每個詞都要匹配
      queryString = words.map((word) => (prefixMatch ? `${word}:*` : word)).join(' & ');
      break;

    case 'phrase':
      // 短語匹配
      queryString = words.join(' <-> ');
      break;

    case 'simple':
    default:
      // OR 邏輯，任一詞匹配即可
      if (prefixMatch) {
        queryString = words.map((word) => `${word}:*`).join(' | ');
      } else {
        queryString = words.join(' | ');
      }
      break;
  }

  return {
    query: queryString,
    mode,
    originalInput: input,
  };
}

/**
 * 建構高亮選項
 */
export function buildHighlightOptions(options: Partial<HighlightOptions> = {}): HighlightOptions {
  return {
    startTag: options.startTag ?? SearchQueryConfig.highlightStartTag,
    endTag: options.endTag ?? SearchQueryConfig.highlightEndTag,
    maxWords: options.maxWords ?? SearchQueryConfig.highlightMaxWords,
  };
}

/**
 * 高亮文字中的搜尋詞
 * 用於前端顯示搜尋結果
 */
export function highlightText(
  text: string,
  searchTerms: string[],
  options: Partial<HighlightOptions> = {}
): string {
  if (!text || searchTerms.length === 0) return text;

  const { startTag, endTag } = buildHighlightOptions(options);

  let result = text;

  for (const term of searchTerms) {
    if (!term) continue;

    // 使用正則表達式進行大小寫不敏感匹配
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    result = result.replace(regex, `${startTag}$1${endTag}`);
  }

  return result;
}

/**
 * 跳脫正則表達式特殊字元
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 從搜尋查詢中提取詞彙
 * 用於前端高亮顯示
 */
export function extractSearchTerms(query: string): string[] {
  const parsed = parseSearchInput(query);
  if (!parsed) return [];

  // 分割並過濾空詞
  return parsed.split(' ').filter((term) => term.length > 0);
}

/**
 * 驗證搜尋查詢
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  const parsed = parseSearchInput(query);

  if (!parsed) {
    return { valid: true }; // 空查詢是有效的（返回所有結果）
  }

  if (parsed.length < SearchQueryConfig.minQueryLength) {
    return {
      valid: false,
      error: `搜尋字詞至少需要 ${SearchQueryConfig.minQueryLength} 個字`,
    };
  }

  if (parsed.length > SearchQueryConfig.maxQueryLength) {
    return {
      valid: false,
      error: `搜尋字詞不能超過 ${SearchQueryConfig.maxQueryLength} 個字`,
    };
  }

  return { valid: true };
}
