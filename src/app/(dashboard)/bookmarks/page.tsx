/**
 * Bookmarks Page - 書籤主頁面
 * T043: 建立 src/app/(dashboard)/bookmarks/page.tsx
 * 📐 Figma: 48:1184
 *
 * Design specs:
 * - Grid layout: 3 columns on desktop, responsive
 * - Bookmark cards with AI status indicator
 * - Tag filters in sidebar/header
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listBookmarks } from '@/services/bookmark.service';
import { BookmarkCard } from '@/components/bookmarks/bookmark-card';
import { BookmarkInput } from '@/components/bookmarks/bookmark-input';
import { BookmarkGridSkeleton } from '@/components/bookmarks/bookmark-skeleton';
import { Plus } from 'lucide-react';

interface BookmarksPageProps {
  searchParams: Promise<{
    q?: string;
    tagId?: string;
    cursor?: string;
    add?: string;
  }>;
}

export const metadata = {
  title: '我的書籤',
};

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const showAddModal = params.add === 'true';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-foreground text-2xl font-bold">我的書籤</h1>
          <p className="text-muted-foreground mt-1 text-sm">管理和組織你收藏的連結</p>
        </div>

        {/* Mobile Add Button */}
        <BookmarkInput>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors lg:hidden">
            <Plus className="h-4 w-4" />
            新增
          </button>
        </BookmarkInput>
      </div>

      {/* Bookmark Grid */}
      <Suspense fallback={<BookmarkGridSkeleton />}>
        <BookmarkList
          userId={session.user.id}
          query={params.q}
          tagId={params.tagId}
          cursor={params.cursor}
        />
      </Suspense>

      {/* Add Bookmark Modal (controlled by URL param) */}
      {showAddModal && <BookmarkInput defaultOpen />}
    </div>
  );
}

async function BookmarkList({
  userId,
  query,
  tagId,
  cursor,
}: {
  userId: string;
  query?: string;
  tagId?: string;
  cursor?: string;
}) {
  const result = await listBookmarks({
    userId,
    query,
    tagId,
    cursor,
    limit: 20,
  });

  if (result.bookmarks.length === 0) {
    return (
      <div className="border-border bg-background-alt/50 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Plus className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-lg font-medium">
          {query ? '找不到符合的書籤' : '還沒有任何書籤'}
        </h3>
        <p className="text-muted-foreground mb-6 text-sm">
          {query ? '請嘗試不同的搜尋關鍵字' : '貼上連結，AI 將自動產生摘要與標籤'}
        </p>
        {!query && (
          <BookmarkInput>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors">
              <Plus className="h-5 w-5" />
              新增第一個書籤
            </button>
          </BookmarkInput>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Results Count */}
      <p className="text-muted-foreground text-sm">
        共 {result.totalCount} 個書籤
        {query && ` (搜尋: "${query}")`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>

      {/* Load More */}
      {result.nextCursor && (
        <div className="flex justify-center pt-4">
          <a
            href={`/bookmarks?cursor=${result.nextCursor}${query ? `&q=${query}` : ''}${tagId ? `&tagId=${tagId}` : ''}`}
            className="border-border text-foreground hover:bg-muted rounded-xl border px-6 py-2.5 text-sm font-medium transition-colors"
          >
            載入更多
          </a>
        </div>
      )}
    </>
  );
}
