/**
 * T062: Tag List - 標籤顯示元件
 * 📐 Figma: 44:35 | 12a-view-bookmark.html
 *
 * Design specs:
 * - AI tags: bg-[rgba(0,212,255,0.15)] text-[#00d4ff]
 * - Custom tags: bg-[rgba(19,78,74,0.3)] text-[#34d399]
 * - Border radius: 8px
 * - Font: 12px medium
 */

'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  isAiGenerated?: boolean;
}

interface TagListProps {
  tags: Tag[];
  onRemove?: (tagId: string) => void;
  maxDisplay?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function TagList({ tags, onRemove, maxDisplay = 5, className, size = 'md' }: TagListProps) {
  const displayTags = maxDisplay > 0 ? tags.slice(0, maxDisplay) : tags;
  const hiddenCount = tags.length - displayTags.length;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors',
            sizeClasses[size],
            tag.isAiGenerated
              ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
              : 'bg-[rgba(19,78,74,0.3)] text-[#34d399]'
          )}
        >
          {tag.name}
          {onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="-mr-1 rounded p-0.5 transition-colors hover:bg-white/10"
              aria-label={`移除標籤 ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className={cn(
            'bg-muted text-muted-foreground inline-flex items-center rounded-lg font-medium',
            sizeClasses[size]
          )}
        >
          +{hiddenCount}
        </span>
      )}
      {tags.length === 0 && <span className="text-muted-foreground text-sm">無標籤</span>}
    </div>
  );
}

interface TagBadgeProps {
  tag: Tag;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onClick, selected, size = 'md' }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-lg font-medium transition-all',
        sizeClasses[size],
        selected
          ? 'ring-primary bg-primary/20 text-primary ring-2'
          : tag.isAiGenerated
            ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.25)]'
            : 'bg-[rgba(19,78,74,0.3)] text-[#34d399] hover:bg-[rgba(19,78,74,0.5)]'
      )}
    >
      {tag.name}
    </button>
  );
}
