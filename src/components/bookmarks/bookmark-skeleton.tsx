/**
 * Bookmark Skeleton - 載入狀態骨架
 */

export function BookmarkCardSkeleton() {
  return (
    <div className="border-border bg-card h-[178px] animate-pulse rounded-2xl border">
      {/* Thumbnail skeleton */}
      <div className="bg-muted h-16 rounded-t-2xl" />
      {/* Content skeleton */}
      <div className="p-4">
        <div className="bg-muted mb-2 h-4 w-3/4 rounded" />
        <div className="bg-muted mb-3 h-3 w-1/4 rounded" />
        <div className="flex gap-2">
          <div className="bg-muted h-5 w-12 rounded-lg" />
          <div className="bg-muted h-5 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function BookmarkGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BookmarkCardSkeleton key={i} />
      ))}
    </div>
  );
}
