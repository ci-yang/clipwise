/**
 * T071: Bookmark Skeleton - 書籤載入骨架
 * 📐 Figma: 48:1184 | 02-dashboard.html
 *
 * Design specs:
 * - Matches BookmarkCard dimensions
 * - Animated pulse effect
 * - Used during loading states
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 單一書籤卡片骨架
 */
export function BookmarkSkeleton() {
  return (
    <div className="border-border bg-card h-[178px] overflow-hidden rounded-2xl border">
      {/* Thumbnail skeleton */}
      <Skeleton className="h-16 w-full rounded-none rounded-t-2xl" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <Skeleton className="mb-2 h-4 w-3/4" />
        {/* Domain */}
        <Skeleton className="mb-3 h-3 w-1/4" />
        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * 別名 - 保持向後相容
 */
export const BookmarkCardSkeleton = BookmarkSkeleton;

/**
 * 書籤網格骨架
 */
export function BookmarkGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BookmarkSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 書籤列表骨架 (用於無限滾動)
 */
export function BookmarkListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookmarkSkeleton key={i} />
      ))}
    </div>
  );
}
