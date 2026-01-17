/**
 * Search Page - 搜尋頁面
 * 📐 Figma: 29:383 | 10-search-results.html
 *
 * Features:
 * - 搜尋輸入框
 * - 篩選按鈕（全部、標題、摘要、標籤）
 * - 搜尋結果列表帶關鍵字高亮
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listBookmarks, type SearchField } from '@/services/bookmark.service';
import { SearchClient } from './search-client';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    field?: string;
  }>;
}

export const metadata = {
  title: '搜尋',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const query = params.q || '';
  const searchField: SearchField = ['all', 'title', 'summary', 'tags'].includes(params.field || '')
    ? (params.field as SearchField)
    : 'all';

  // Fetch initial results if query exists
  let initialResults: Awaited<ReturnType<typeof listBookmarks>>['bookmarks'] = [];
  let totalCount = 0;

  if (query) {
    const result = await listBookmarks({
      userId: session.user.id,
      query,
      searchField,
      limit: 20,
    });
    initialResults = result.bookmarks;
    totalCount = result.totalCount;
  }

  return (
    <SearchClient
      initialQuery={query}
      initialField={searchField}
      initialResults={initialResults}
      totalCount={totalCount}
    />
  );
}
