/**
 * T080: Search Wrapper - 搜尋包裝元件
 * 處理 URL 搜尋參數和客戶端搜尋狀態
 */

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { SearchInput } from './search-input';

interface SearchWrapperProps {
  className?: string;
}

export function SearchWrapper({ className }: SearchWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get('q') || '';

  const handleSearch = useCallback(
    (query: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (query) {
          params.set('q', query);
        } else {
          params.delete('q');
        }

        // Reset cursor when search changes
        params.delete('cursor');

        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const handleClear = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      params.delete('cursor');
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams]);

  return (
    <SearchInput
      defaultValue={currentQuery}
      onSearch={handleSearch}
      onClear={handleClear}
      isLoading={isPending}
      placeholder="搜尋書籤標題、摘要..."
      className={className}
    />
  );
}
