/**
 * T080: Bookmarks Page - 書籤主頁面
 * 📐 Figma: 48:1184 | 02-dashboard.html
 *
 * Features:
 * - Server-side initial data fetch
 * - Client-side infinite scroll
 * - Full-text search with highlighting
 * - Tag filtering
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listBookmarks } from '@/services/bookmark.service';
import { BookmarkInfiniteList } from '@/components/bookmarks/bookmark-infinite-list';
import { BookmarkInput } from '@/components/bookmarks/bookmark-input';
import { BookmarkGridSkeleton } from '@/components/bookmarks/bookmark-skeleton';
import { EmptyState } from '@/components/bookmarks/empty-state';
import { SearchWrapper } from '@/components/bookmarks/search-wrapper';
import { SearchResultsCount, NoSearchResults } from '@/components/bookmarks/search-highlight';
import { Plus } from 'lucide-react';

interface BookmarksPageProps {
  searchParams: Promise<{
    q?: string;
    tagId?: string;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-foreground text-2xl font-bold">我的書籤</h1>
          <p className="text-muted-foreground mt-1 text-sm">管理和組織你收藏的連結</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <SearchWrapper className="w-full sm:w-64" />

          {/* Mobile Add Button */}
          <BookmarkInput>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors lg:hidden">
              <Plus className="h-4 w-4" />
              新增
            </button>
          </BookmarkInput>
        </div>
      </div>

      {/* Bookmark List with Infinite Scroll */}
      <Suspense fallback={<BookmarkGridSkeleton />}>
        <BookmarkListContainer userId={session.user.id} query={params.q} tagId={params.tagId} />
      </Suspense>

      {/* Add Bookmark Modal (controlled by URL param) */}
      {showAddModal && <BookmarkInput defaultOpen />}
    </div>
  );
}

async function BookmarkListContainer({
  userId,
  query,
  tagId,
}: {
  userId: string;
  query?: string;
  tagId?: string;
}) {
  const result = await listBookmarks({
    userId,
    query,
    tagId,
    limit: 20,
  });

  // Show empty state for first-time users
  if (result.bookmarks.length === 0 && !query && !tagId) {
    return (
      <div className="border-border bg-background-alt/50 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Plus className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-lg font-medium">還沒有任何書籤</h3>
        <p className="text-muted-foreground mb-6 text-sm">貼上連結，AI 將自動產生摘要與標籤</p>
        <BookmarkInput>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors">
            <Plus className="h-5 w-5" />
            新增第一個書籤
          </button>
        </BookmarkInput>
      </div>
    );
  }

  // Show search empty state
  if (result.bookmarks.length === 0 && (query || tagId)) {
    if (query) {
      return <NoSearchResults query={query} />;
    }
    return (
      <EmptyState
        variant="folder"
        message="此標籤下沒有書籤"
        description="嘗試其他標籤或新增書籤到此標籤"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Results Count */}
      {query && <SearchResultsCount count={result.totalCount} query={query} />}

      {/* Bookmark List */}
      <BookmarkInfiniteList
        initialBookmarks={result.bookmarks}
        initialCursor={result.nextCursor}
        totalCount={result.totalCount}
        query={query}
        tagId={tagId}
      />
    </div>
  );
}
