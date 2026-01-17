/**
 * T078: Search Input - 搜尋輸入元件
 * 📐 Figma: 29:383 | 10-search-results.html
 *
 * Features:
 * - Debounced search (300ms)
 * - Clear button
 * - Loading state
 * - Keyboard shortcuts
 */

'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSearchQuery, SearchQueryConfig } from '@/lib/search';

interface SearchInputProps {
  /** 初始搜尋值 */
  defaultValue?: string;
  /** 搜尋回調 */
  onSearch: (query: string) => void;
  /** 清除搜尋回調 */
  onClear?: () => void;
  /** 是否正在載入 */
  isLoading?: boolean;
  /** 佔位符文字 */
  placeholder?: string;
  /** 自訂類名 */
  className?: string;
  /** 是否自動聚焦 */
  autoFocus?: boolean;
  /** Debounce 延遲時間 (ms) */
  debounceMs?: number;
}

export function SearchInput({
  defaultValue = '',
  onSearch,
  onClear,
  isLoading = false,
  placeholder = '搜尋書籤...',
  className,
  autoFocus = false,
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear previous timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Validate query
      const validation = validateSearchQuery(query);
      if (!validation.valid) {
        setError(validation.error || null);
        return;
      }

      setError(null);

      // Set new timer
      debounceRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  // Handle clear
  const handleClear = () => {
    setValue('');
    setError(null);
    onSearch('');
    onClear?.();
    inputRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Enter') {
      // Immediate search on Enter
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const validation = validateSearchQuery(value);
      if (validation.valid) {
        setError(null);
        onSearch(value);
      } else {
        setError(validation.error || null);
      }
    }
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Sync defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'border-border bg-card flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all',
          'focus-within:ring-primary/50 focus-within:ring-2',
          error && 'border-destructive focus-within:ring-destructive/50'
        )}
      >
        {/* Search Icon / Loading */}
        {isLoading ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : (
          <Search className="text-muted-foreground h-4 w-4" />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={SearchQueryConfig.maxQueryLength}
          className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          aria-label="搜尋書籤"
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="清除搜尋"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}

/**
 * Compact Search Input for Header
 */
export function CompactSearchInput({
  defaultValue = '',
  onSearch,
  isLoading = false,
  placeholder = '搜尋...',
  className,
}: Pick<
  SearchInputProps,
  'defaultValue' | 'onSearch' | 'isLoading' | 'placeholder' | 'className'
>) {
  const [isExpanded, setIsExpanded] = useState(!!defaultValue);

  const handleExpand = () => {
    setIsExpanded(true);
    // SearchInput will auto-focus due to autoFocus prop
  };

  const handleCollapse = () => {
    if (!defaultValue) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          'text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-2 transition-colors',
          className
        )}
        aria-label="開啟搜尋"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <SearchInput
      defaultValue={defaultValue}
      onSearch={onSearch}
      onClear={handleCollapse}
      isLoading={isLoading}
      placeholder={placeholder}
      autoFocus
      className={cn('w-64', className)}
    />
  );
}
