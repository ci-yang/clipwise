/**
 * T080: Bookmarks Page - 書籤主頁面
 * 📐 Figma: 48:1184 | 02-dashboard.html
 *
 * Features:
 * - Server-side initial data fetch
 * - Client-side infinite scroll
 * - Full-text search with highlighting (search in header)
 * - Tag filtering
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listBookmarks } from '@/services/bookmark.service';
import { BookmarkInfiniteList } from '@/components/bookmarks/bookmark-infinite-list';
import { BookmarkInput } from '@/components/bookmarks/bookmark-input';
import { EmptyState } from '@/components/bookmarks/empty-state';
import { SearchResultsCount, NoSearchResults } from '@/components/bookmarks/search-highlight';
import { TagFilterContainer } from '@/components/bookmarks/tag-filter-container';

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

  // Get initial data for header count
  const initialResult = await listBookmarks({
    userId: session.user.id,
    query: params.q,
    tagId: params.tagId,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Page Header - Figma: 48:1201 */}
      <div className="flex items-center justify-between">
        {/* Title Section - Figma: 48:1202 */}
        <div className="flex flex-col gap-1">
          <h1 className="font-['Noto_Sans_TC'] text-2xl font-bold text-[#e8f0f7]">我的書籤</h1>
          <p className="text-sm font-normal text-[#8892a0]">共 {initialResult.totalCount} 個書籤</p>
        </div>

        {/* Add Bookmark Button - Figma: 48:1207 */}
        <BookmarkInput>
          <button className="flex items-center rounded-xl bg-[#00d4ff] px-4 py-2.5 text-base font-medium text-[#0a1628] transition-colors hover:bg-[#00d4ff]/90">
            新增書籤
          </button>
        </BookmarkInput>
      </div>

      {/* Tag Filter Bar - Figma: 48:1209 */}
      <TagFilterContainer className="scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6" />

      {/* Bookmark List with Infinite Scroll */}
      <BookmarkListContainerWithData
        result={initialResult}
        query={params.q}
        tagId={params.tagId}
      />

      {/* Add Bookmark Modal (controlled by URL param) */}
      {showAddModal && <BookmarkInput defaultOpen />}
    </div>
  );
}

// Type for list bookmarks result
interface ListBookmarksResult {
  bookmarks: Awaited<ReturnType<typeof listBookmarks>>['bookmarks'];
  nextCursor: string | null;
  totalCount: number;
}

function BookmarkListContainerWithData({
  result,
  query,
  tagId,
}: {
  result: ListBookmarksResult;
  query?: string;
  tagId?: string;
}) {
  // Show empty state for first-time users - Figma: 28:608
  if (result.bookmarks.length === 0 && !query && !tagId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#234567] bg-[rgba(19,35,55,0.5)] py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#132337]">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="mb-2 text-lg font-medium text-[#e8f0f7]">還沒有任何書籤</h3>
        <p className="mb-6 text-sm text-[#8892a0]">貼上連結，AI 將自動產生摘要與標籤</p>
        <BookmarkInput>
          <button className="flex items-center gap-2 rounded-xl bg-[#00d4ff] px-6 py-3 font-medium text-[#0a1628] transition-colors hover:bg-[#00d4ff]/90">
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

      {/* Bookmark List - Figma: 48:1220 */}
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
