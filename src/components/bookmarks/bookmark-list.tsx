/**
 * T069: Bookmark List - 書籤列表元件
 * 📐 Figma: 48:1184 | 02-dashboard.html
 *
 * Features:
 * - Grid layout for bookmark cards
 * - Infinite scroll loading
 * - Loading skeletons
 * - Empty state
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { BookmarkCard } from './bookmark-card';
import { BookmarkSkeleton } from './bookmark-skeleton';
import { EmptyState } from './empty-state';
import type { BookmarkWithTags } from '@/services/bookmark.service';

interface BookmarkListProps {
  bookmarks: BookmarkWithTags[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
}

export function BookmarkList({
  bookmarks,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = '還沒有任何書籤',
  emptyAction,
}: BookmarkListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Setup intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target && target.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleObserver]);

  // Show loading skeletons
  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookmarkSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && bookmarks.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="space-y-4">
      {/* Bookmark Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}

        {/* Loading more skeletons */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <BookmarkSkeleton key={`loading-${i}`} />)}
      </div>

      {/* Load more trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}

      {/* End of list indicator */}
      {!hasMore && bookmarks.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">已顯示所有書籤</p>
      )}
    </div>
  );
}

/**
 * Simple Bookmark Grid without infinite scroll
 */
export function BookmarkGrid({ bookmarks }: { bookmarks: BookmarkWithTags[] }) {
  if (bookmarks.length === 0) {
    return <EmptyState message="沒有找到符合條件的書籤" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}
