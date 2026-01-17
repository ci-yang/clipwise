/**
 * T086: Tag Filter - 標籤篩選元件
 * 📐 Figma: 44:145 | 11-tag-filter.html
 *
 * Design specs from Figma:
 * - Selected tag: bg-[#00d4ff] text-[#0a1628] rounded-xl
 * - Unselected tag: bg-[#132337] border-[#234567] text-[#e8f0f7] rounded-xl
 * - Tag with count: gap-1
 * - Selected badge (header): bg-[#00d4ff] text-[#0a1628] rounded-lg with X button
 */

'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface TagFilterProps {
  /** 所有可用標籤 */
  tags: TagWithCount[];
  /** 已選中的標籤 ID */
  selectedTagIds: string[];
  /** 選中/取消選中標籤的回調 */
  onTagToggle: (tagId: string) => void;
  /** 清除所有選中標籤 */
  onClearAll?: () => void;
  /** 是否顯示已選標籤區域 */
  showSelectedBadges?: boolean;
  /** 自定義 className */
  className?: string;
  /** 是否載入中 */
  isLoading?: boolean;
}

/**
 * 標籤篩選元件
 * 用於 Dashboard 頁面的標籤篩選列和標籤管理頁面的標籤雲
 */
export function TagFilter({
  tags,
  selectedTagIds,
  onTagToggle,
  onClearAll,
  showSelectedBadges = false,
  className,
  isLoading = false,
}: TagFilterProps) {
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const hasSelectedTags = selectedTags.length > 0;

  const handleClearAll = useCallback(() => {
    onClearAll?.();
  }, [onClearAll]);

  if (isLoading) {
    return (
      <div className={cn('flex gap-2', className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-9 w-20 animate-pulse rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 已選標籤區域 */}
      {showSelectedBadges && hasSelectedTags && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">已選：</span>
          {selectedTags.map((tag) => (
            <SelectedTagBadge key={tag.id} tag={tag} onRemove={() => onTagToggle(tag.id)} />
          ))}
          {onClearAll && (
            <button
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              清除全部
            </button>
          )}
        </div>
      )}

      {/* 標籤列表 */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <TagButton
              key={tag.id}
              tag={tag}
              isSelected={isSelected}
              onClick={() => onTagToggle(tag.id)}
            />
          );
        })}
        {tags.length === 0 && <span className="text-muted-foreground text-sm">尚無標籤</span>}
      </div>
    </div>
  );
}

/**
 * 標籤按鈕（用於標籤雲）
 */
interface TagButtonProps {
  tag: TagWithCount;
  isSelected: boolean;
  onClick: () => void;
}

function TagButton({ tag, isSelected, onClick }: TagButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-all',
        isSelected
          ? 'bg-secondary text-background hover:bg-secondary/90'
          : 'bg-background-alt border-border text-foreground hover:border-secondary/50 hover:text-secondary border'
      )}
    >
      <span>{tag.name}</span>
      <span className={cn('text-sm', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
        {tag.count}
      </span>
    </button>
  );
}

/**
 * 已選標籤 Badge（用於 header 區域）
 */
interface SelectedTagBadgeProps {
  tag: TagWithCount;
  onRemove: () => void;
}

function SelectedTagBadge({ tag, onRemove }: SelectedTagBadgeProps) {
  return (
    <span className="bg-secondary text-background inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium">
      {tag.name}
      <button
        onClick={onRemove}
        className="text-background/70 hover:text-background transition-colors"
        aria-label={`移除標籤 ${tag.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/**
 * 標籤篩選列（Dashboard 頂部橫向滾動）
 * 📐 Figma: 48:1209
 */
interface TagFilterBarProps {
  tags: TagWithCount[];
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  className?: string;
  isLoading?: boolean;
}

export function TagFilterBar({
  tags,
  selectedTagId,
  onTagSelect,
  className,
  isLoading = false,
}: TagFilterBarProps) {
  if (isLoading) {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-9 w-24 shrink-0 animate-pulse rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {/* 全部按鈕 */}
      <button
        onClick={() => onTagSelect(null)}
        className={cn(
          'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
          selectedTagId === null
            ? 'bg-secondary text-background'
            : 'bg-background-alt border-border text-muted-foreground hover:text-foreground border'
        )}
      >
        全部
      </button>

      {/* 標籤按鈕 */}
      {tags.map((tag) => {
        const isSelected = selectedTagId === tag.id;
        return (
          <button
            key={tag.id}
            onClick={() => onTagSelect(isSelected ? null : tag.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
              isSelected
                ? 'bg-secondary text-background'
                : 'bg-background-alt border-border text-muted-foreground hover:text-foreground border'
            )}
          >
            {tag.name} ({tag.count})
          </button>
        );
      })}
    </div>
  );
}

/**
 * 標籤雲容器（玻璃態背景）
 * 📐 Figma: 44:197
 */
interface TagCloudProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TagCloud({ title = '所有標籤', children, className }: TagCloudProps) {
  return (
    <div className={cn('glass border-border rounded-xl border p-6', className)}>
      {title && <h2 className="text-foreground mb-4 text-lg font-bold">{title}</h2>}
      {children}
    </div>
  );
}

/**
 * 篩選結果標題
 */
interface FilterResultsHeaderProps {
  count: number;
  label?: string;
  className?: string;
}

export function FilterResultsHeader({
  count,
  label = '符合條件的書籤',
  className,
}: FilterResultsHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <h2 className="text-foreground text-lg font-bold">{label}</h2>
      <span className="text-secondary text-lg font-bold">{count}</span>
    </div>
  );
}
