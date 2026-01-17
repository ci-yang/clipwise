/**
 * Tags Page - 標籤管理頁面
 * 📐 Figma: 44:145 | 11-tag-filter.html
 *
 * Features:
 * - 顯示所有標籤
 * - 每個標籤顯示書籤數量
 * - 點擊標籤篩選書籤
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTagsWithCount } from '@/services/tag.service';
import Link from 'next/link';

export const metadata = {
  title: '標籤管理',
};

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const tags = await getTagsWithCount(session.user.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Noto_Sans_TC'] text-2xl font-bold text-[#e8f0f7]">標籤管理</h1>
          <p className="text-sm font-normal text-[#8892a0]">共 {tags.length} 個標籤</p>
        </div>
      </div>

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#234567] bg-[rgba(19,35,55,0.5)] py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#132337]">
            <span className="text-3xl">🏷️</span>
          </div>
          <h3 className="mb-2 text-lg font-medium text-[#e8f0f7]">還沒有任何標籤</h3>
          <p className="mb-6 text-sm text-[#8892a0]">新增書籤後，AI 將自動產生標籤</p>
          <Link
            href="/bookmarks"
            className="flex items-center gap-2 rounded-xl bg-[#00d4ff] px-6 py-3 font-medium text-[#0a1628] transition-colors hover:bg-[#00d4ff]/90"
          >
            前往書籤
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/bookmarks?tagId=${tag.id}`}
              className="group flex items-center justify-between rounded-xl border border-[#234567] bg-[#132337] p-4 transition-all hover:border-[#00d4ff]/50 hover:shadow-lg hover:shadow-[#00d4ff]/5"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-lg bg-[rgba(0,212,255,0.15)] px-3 py-1.5 text-sm font-medium text-[#00d4ff]">
                  {tag.name}
                </span>
              </div>
              <span className="text-sm text-[#8892a0] group-hover:text-[#e8f0f7]">
                {tag._count?.bookmarks ?? 0} 個書籤
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
