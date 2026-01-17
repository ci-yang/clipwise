/**
 * Search Client - 搜尋結果頁面客戶端元件
 * 📐 Figma: 29:383 | 10-search-results.html
 *
 * Features:
 * - 搜尋輸入框帶有篩選選項
 * - 搜尋結果列表帶有關鍵字高亮
 * - 篩選按鈕：全部、標題、摘要、標籤
 */

'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchResultCard } from './search-result-card';
import type { BookmarkWithTags, SearchField } from '@/services/bookmark.service';

interface SearchClientProps {
  initialQuery: string;
  initialField: SearchField;
  initialResults: BookmarkWithTags[];
  totalCount: number;
}

const SEARCH_FILTERS: { label: string; value: SearchField }[] = [
  { label: '全部', value: 'all' },
  { label: '標題', value: 'title' },
  { label: '摘要', value: 'summary' },
  { label: '標籤', value: 'tags' },
];

export function SearchClient({
  initialQuery,
  initialField,
  initialResults,
  totalCount,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [activeField, setActiveField] = useState<SearchField>(initialField);
  // Use initialResults and totalCount directly since they come from server
  const results = initialResults;
  const count = totalCount;
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search with URL update
  const handleSearch = useCallback(
    (newQuery: string, field: SearchField = activeField) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (newQuery) {
          params.set('q', newQuery);
        } else {
          params.delete('q');
        }

        if (field !== 'all') {
          params.set('field', field);
        } else {
          params.delete('field');
        }

        router.push(`/search?${params.toString()}`);
      });
    },
    [router, searchParams, activeField]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (field: SearchField) => {
      setActiveField(field);
      if (query) {
        handleSearch(query, field);
      }
    },
    [query, handleSearch]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    router.push('/search');
    inputRef.current?.focus();
  }, [router]);

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch(query);
      } else if (e.key === 'Escape') {
        if (query) {
          handleClear();
        }
      }
    },
    [query, handleSearch, handleClear]
  );

  return (
    <div className="space-y-6">
      {/* Page Header - Figma: 29:384 */}
      <div className="flex flex-col gap-1">
        <h1 className="font-['Noto_Sans_TC'] text-2xl font-bold text-[#e8f0f7]">搜尋結果</h1>
        {query && (
          <p className="text-sm text-[#8892a0]">
            找到 <span className="font-medium text-[#e8f0f7]">{count}</span> 個符合「
            <span className="text-[#00d4ff]">{query}</span>」的結果
          </p>
        )}
      </div>

      {/* Search Input - Figma: 29:391 */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border bg-[#0a1628] px-4 py-3 transition-all',
            query ? 'border-[#00d4ff]' : 'border-[#234567]',
            'focus-within:border-[#00d4ff]'
          )}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#00d4ff]" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-[#8892a0]" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜尋書籤標題、摘要、標籤..."
            autoFocus
            className="flex-1 bg-transparent text-base font-light text-[#e8f0f7] placeholder:text-[#8892a0] focus:outline-none"
          />

          {query && (
            <button
              onClick={handleClear}
              className="shrink-0 text-[#8892a0] transition-colors hover:text-[#e8f0f7]"
              aria-label="清除搜尋"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons - Figma: 29:397 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#8892a0]">篩選：</span>
        {SEARCH_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition-colors',
              activeField === filter.value
                ? 'bg-[#00d4ff] font-medium text-[#0a1628]'
                : 'text-[#8892a0] hover:bg-[#234567]/30 hover:text-[#e8f0f7]'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Search Results - Figma: 29:410 */}
      {query ? (
        results.length > 0 ? (
          <div className="space-y-4">
            {results.map((bookmark) => (
              <SearchResultCard key={bookmark.id} bookmark={bookmark} query={query} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#132337]">
                <Search className="h-8 w-8 text-[#8892a0]" />
              </div>
            </div>
            <p className="text-lg text-[#e8f0f7]">
              找不到符合「<span className="text-[#00d4ff]">{query}</span>」的結果
            </p>
            <p className="mt-2 text-sm text-[#8892a0]">請嘗試其他關鍵字或調整篩選條件</p>
          </div>
        )
      ) : (
        <div className="py-16 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#132337]">
              <Search className="h-8 w-8 text-[#8892a0]" />
            </div>
          </div>
          <p className="text-lg text-[#e8f0f7]">輸入關鍵字開始搜尋</p>
          <p className="mt-2 text-sm text-[#8892a0]">可搜尋書籤標題、摘要或標籤</p>
        </div>
      )}
    </div>
  );
}
