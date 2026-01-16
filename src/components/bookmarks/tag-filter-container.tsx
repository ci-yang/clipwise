/**
 * T087: Tag Filter Container - 標籤篩選容器
 * 📐 Figma: 48:1209
 *
 * 客戶端元件，處理：
 * - 標籤資料取得
 * - URL 參數同步
 * - 篩選狀態管理
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { TagFilterBar } from './tag-filter';
import { useTags } from '@/hooks/use-tags';

interface TagFilterContainerProps {
  className?: string;
}

export function TagFilterContainer({ className }: TagFilterContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tags, isLoading } = useTags();

  const currentTagId = searchParams.get('tagId');

  const handleTagSelect = useCallback(
    (tagId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (tagId) {
        params.set('tagId', tagId);
      } else {
        params.delete('tagId');
      }

      // 保留搜尋參數
      const query = params.toString();
      router.push(query ? `/bookmarks?${query}` : '/bookmarks');
    },
    [router, searchParams]
  );

  // 不顯示如果沒有標籤
  if (!isLoading && tags.length === 0) {
    return null;
  }

  return (
    <TagFilterBar
      tags={tags}
      selectedTagId={currentTagId}
      onTagSelect={handleTagSelect}
      isLoading={isLoading}
      className={className}
    />
  );
}
