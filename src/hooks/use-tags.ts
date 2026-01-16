/**
 * T087: useTags Hook - 標籤資料取得與快取
 * 用於在客戶端取得用戶的標籤列表
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TagWithCount } from '@/components/bookmarks/tag-filter';

interface UseTagsOptions {
  /** 是否自動載入 */
  autoLoad?: boolean;
}

interface UseTagsReturn {
  /** 標籤列表 */
  tags: TagWithCount[];
  /** 載入狀態 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 手動重新載入 */
  refetch: () => Promise<void>;
}

export function useTags(options: UseTagsOptions = {}): UseTagsReturn {
  const { autoLoad = true } = options;

  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchTags();
    }
  }, [autoLoad, fetchTags]);

  return {
    tags,
    isLoading,
    error,
    refetch: fetchTags,
  };
}
