/**
 * T079: Search Highlight - 搜尋結果高亮元件
 * 📐 Figma: 29:383 | 10-search-results.html
 *
 * Features:
 * - Highlight matching text
 * - Support for Chinese and English
 * - Customizable highlight styles
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { extractSearchTerms } from '@/lib/search';

interface SearchHighlightProps {
  /** 要顯示的文字 */
  text: string;
  /** 搜尋查詢 */
  query: string;
  /** 自訂類名 */
  className?: string;
  /** 高亮樣式類名 */
  highlightClassName?: string;
  /** 最大顯示長度 */
  maxLength?: number;
  /** 是否顯示省略號 */
  showEllipsis?: boolean;
}

/**
 * 高亮搜尋匹配文字
 */
export function SearchHighlight({
  text,
  query,
  className,
  // Figma design: yellow highlight bg-[rgba(251,191,36,0.3)] text-[#fbbf24]
  highlightClassName = 'bg-[rgba(251,191,36,0.3)] text-[#fbbf24] font-medium',
  maxLength,
  showEllipsis = true,
}: SearchHighlightProps) {
  const highlighted = useMemo(() => {
    if (!text) return null;
    if (!query) return truncateText(text, maxLength, showEllipsis);

    const terms = extractSearchTerms(query);
    if (terms.length === 0) return truncateText(text, maxLength, showEllipsis);

    // Create regex pattern for all terms (case-insensitive)
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');

    // Split text by matches
    const parts = text.split(pattern);

    // Find the first match position for context extraction
    let firstMatchIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (terms.some((term) => parts[i]?.toLowerCase() === term.toLowerCase())) {
        firstMatchIndex = parts.slice(0, i).join('').length;
        break;
      }
    }

    // If we need to truncate and there's a match, center around the match
    let displayText = text;

    if (maxLength && text.length > maxLength && firstMatchIndex >= 0) {
      const contextBefore = Math.floor((maxLength - 20) / 2);
      const start = Math.max(0, firstMatchIndex - contextBefore);
      const end = Math.min(text.length, start + maxLength);
      displayText = text.slice(start, end);

      if (start > 0) displayText = '...' + displayText;
      if (end < text.length) displayText = displayText + '...';
    } else if (maxLength && text.length > maxLength) {
      displayText = truncateText(text, maxLength, showEllipsis) || '';
    }

    // Split the potentially truncated text
    const displayParts = displayText.split(pattern);

    return displayParts.map((part, index) => {
      // Check if this part is a match
      const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());

      if (isMatch) {
        return (
          <mark key={index} className={cn('rounded px-0.5', highlightClassName)}>
            {part}
          </mark>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }, [text, query, maxLength, showEllipsis, highlightClassName]);

  return <span className={className}>{highlighted}</span>;
}

/**
 * 高亮搜尋結果摘要
 * 自動提取包含匹配詞的上下文
 */
export function SearchHighlightSummary({
  text,
  query,
  className,
  highlightClassName,
  maxLength = 150,
}: SearchHighlightProps) {
  const contextText = useMemo(() => {
    if (!text || !query) return text;

    const terms = extractSearchTerms(query);
    if (terms.length === 0) return text;

    // Find the best context - the area with the most matches
    let bestStart = 0;
    let bestMatchCount = 0;

    const windowSize = maxLength;
    const textLower = text.toLowerCase();

    for (let i = 0; i <= text.length - windowSize; i += 10) {
      const window = textLower.slice(i, i + windowSize);
      let matchCount = 0;

      for (const term of terms) {
        const termLower = term.toLowerCase();
        let pos = 0;
        while ((pos = window.indexOf(termLower, pos)) !== -1) {
          matchCount++;
          pos += termLower.length;
        }
      }

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestStart = i;
      }
    }

    // Extract the best context
    if (bestMatchCount > 0 && text.length > maxLength) {
      let result = text.slice(bestStart, bestStart + maxLength);
      if (bestStart > 0) result = '...' + result;
      if (bestStart + maxLength < text.length) result = result + '...';
      return result;
    }

    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }, [text, query, maxLength]);

  return (
    <SearchHighlight
      text={contextText || ''}
      query={query}
      className={className}
      highlightClassName={highlightClassName}
      maxLength={undefined} // Already truncated
      showEllipsis={false}
    />
  );
}

/**
 * 輔助函數：截斷文字
 */
function truncateText(text: string, maxLength?: number, showEllipsis = true): string {
  if (!text) return '';
  if (!maxLength || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + (showEllipsis ? '...' : '');
}

/**
 * 輔助函數：跳脫正則表達式特殊字元
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 搜尋結果計數顯示
 */
export function SearchResultsCount({
  count,
  query,
  className,
}: {
  count: number;
  query: string;
  className?: string;
}) {
  if (!query) return null;

  return (
    <p className={cn('text-muted-foreground text-sm', className)}>
      找到 <span className="text-foreground font-medium">{count}</span> 個符合 「
      <span className="text-primary">{query}</span>」的結果
    </p>
  );
}

/**
 * 無搜尋結果提示
 */
export function NoSearchResults({ query, className }: { query: string; className?: string }) {
  return (
    <div className={cn('py-12 text-center', className)}>
      <p className="text-muted-foreground">
        找不到符合「<span className="text-foreground">{query}</span>」的結果
      </p>
      <p className="text-muted-foreground mt-2 text-sm">請嘗試其他關鍵字或檢查拼寫</p>
    </div>
  );
}
