/**
 * T072: BookmarkInfiniteList - 書籤無限滾動列表
 * 📐 Figma: 48:1184 | 02-dashboard.html
 *
 * Features:
 * - Client-side infinite scroll
 * - Intersection Observer for auto-loading
 * - Loading and error states
 */

'use client';

import { useCallback } from 'react';
import { BookmarkListCard } from './bookmark-list-card';
import { BookmarkSkeleton } from './bookmark-skeleton';
import { EmptyState } from './empty-state';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import type { BookmarkWithTags } from '@/services/bookmark.service';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface BookmarkInfiniteListProps {
  /** 初始書籤資料 */
  initialBookmarks: BookmarkWithTags[];
  /** 初始 cursor */
  initialCursor: string | null;
  /** 總數 */
  totalCount: number;
  /** 搜尋關鍵字 */
  query?: string;
  /** 標籤篩選 */
  tagId?: string;
}

export function BookmarkInfiniteList({
  initialBookmarks,
  initialCursor,
  totalCount,
  query,
  tagId,
}: BookmarkInfiniteListProps) {
  // Fetch more bookmarks
  const fetchMore = useCallback(
    async (cursor: string) => {
      const params = new URLSearchParams({ cursor });
      if (query) params.set('q', query);
      if (tagId) params.set('tagId', tagId);

      const response = await fetch(`/api/bookmarks?${params.toString()}`);
      if (!response.ok) {
        throw new Error('載入失敗');
      }

      const result = await response.json();
      return {
        data: result.data as BookmarkWithTags[],
        nextCursor: result.nextCursor as string | null,
      };
    },
    [query, tagId]
  );

  const {
    data: bookmarks,
    isLoading,
    hasMore,
    error,
    loadMoreRef,
    loadMore,
  } = useInfiniteScroll<BookmarkWithTags>({
    initialData: initialBookmarks,
    initialCursor,
    initialHasMore: initialCursor !== null,
    fetchMore,
  });

  // Empty state
  if (bookmarks.length === 0 && !isLoading) {
    return (
      <EmptyState
        variant={query ? 'search' : 'default'}
        message={query ? '找不到符合的書籤' : undefined}
        description={query ? `沒有找到包含「${query}」的書籤` : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <p className="text-muted-foreground text-sm">
        共 {totalCount} 個書籤
        {query && ` (搜尋: "${query}")`}
      </p>

      {/* Bookmark Grid - 2 column layout matching Figma */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {bookmarks.map((bookmark) => (
          <BookmarkListCard key={bookmark.id} bookmark={bookmark} />
        ))}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={`loading-${i}`} />)}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="text-destructive mb-2 h-8 w-8" />
          <p className="text-destructive mb-4 text-sm">{error}</p>
          <button
            onClick={loadMore}
            className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重試
          </button>
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !error && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}

      {/* End of list */}
      {!hasMore && !error && bookmarks.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">已顯示所有書籤</p>
      )}
    </div>
  );
}
