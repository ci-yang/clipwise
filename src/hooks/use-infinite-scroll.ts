/**
 * T072: useInfiniteScroll Hook
 * 無限滾動載入邏輯
 *
 * Features:
 * - Intersection Observer for scroll detection
 * - Cursor-based pagination
 * - Loading state management
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  /** 初始資料 */
  initialData: T[];
  /** 初始 cursor */
  initialCursor: string | null;
  /** 是否還有更多資料 */
  initialHasMore: boolean;
  /** 載入更多資料的函數 */
  fetchMore: (cursor: string) => Promise<{
    data: T[];
    nextCursor: string | null;
  }>;
  /** Observer 觸發的 root margin */
  rootMargin?: string;
}

interface UseInfiniteScrollReturn<T> {
  /** 所有已載入的資料 */
  data: T[];
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否還有更多資料 */
  hasMore: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 載入更多觸發元素的 ref */
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  /** 手動載入更多 */
  loadMore: () => void;
  /** 重置狀態 */
  reset: (newData: T[], newCursor: string | null) => void;
  /** 移除項目 */
  removeItem: (predicate: (item: T) => boolean) => void;
  /** 更新項目 */
  updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
}

export function useInfiniteScroll<T>({
  initialData,
  initialCursor,
  initialHasMore,
  fetchMore,
  rootMargin = '200px',
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset when initialData changes (e.g., after adding a new bookmark)
  useEffect(() => {
    setData(initialData);
    setCursor(initialCursor);
    setHasMore(initialCursor !== null);
    setError(null);
  }, [initialData, initialCursor]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (!cursor || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMore(cursor);
      setData((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading, hasMore, fetchMore]);

  // Reset function
  const reset = useCallback((newData: T[], newCursor: string | null) => {
    setData(newData);
    setCursor(newCursor);
    setHasMore(newCursor !== null);
    setError(null);
  }, []);

  // Remove item function
  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setData((prev) => prev.filter((item) => !predicate(item)));
  }, []);

  // Update item function
  const updateItem = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setData((prev) => prev.map((item) => (predicate(item) ? updater(item) : item)));
    },
    []
  );

  // Setup intersection observer
  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target && target.isIntersecting && hasMore && !isLoading && cursor) {
        loadMore();
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, cursor, loadMore, rootMargin]);

  // Update ref when it changes
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    const currentObserver = observerRef.current;

    if (currentRef && currentObserver) {
      currentObserver.observe(currentRef);
    }

    return () => {
      if (currentRef && currentObserver) {
        currentObserver.unobserve(currentRef);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMoreRef,
    loadMore,
    reset,
    removeItem,
    updateItem,
  };
}
