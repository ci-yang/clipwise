/**
 * T070: Empty State - 空狀態元件
 * 📐 Figma: 28:608 | 14-empty-state.html
 *
 * Design specs:
 * - Centered layout
 * - Icon + message + optional action
 * - Different variants for different contexts
 */

'use client';

import { BookmarkPlus, Search, Tag, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'tags' | 'folder';
}

const VARIANTS = {
  default: {
    Icon: BookmarkPlus,
    defaultMessage: '還沒有任何書籤',
    defaultDescription: '開始收藏你喜愛的網頁，讓 AI 幫你整理',
  },
  search: {
    Icon: Search,
    defaultMessage: '沒有找到符合的結果',
    defaultDescription: '試試其他關鍵字或清除搜尋條件',
  },
  tags: {
    Icon: Tag,
    defaultMessage: '沒有標籤',
    defaultDescription: '書籤的標籤會在這裡顯示',
  },
  folder: {
    Icon: FolderOpen,
    defaultMessage: '此分類沒有書籤',
    defaultDescription: '嘗試其他分類或新增書籤',
  },
};

export function EmptyState({ message, description, action, variant = 'default' }: EmptyStateProps) {
  const { Icon, defaultMessage, defaultDescription } = VARIANTS[variant];

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-4 py-12 text-center">
      {/* Icon Container */}
      <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Icon className="text-primary h-10 w-10" />
      </div>

      {/* Message */}
      <h3 className="text-foreground mb-2 text-lg font-semibold">{message || defaultMessage}</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        {description || defaultDescription}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-colors"
        >
          <BookmarkPlus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Compact empty state for inline use
 */
export function CompactEmptyState({
  message = '無資料',
  icon: IconComponent = FolderOpen,
}: {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IconComponent className="text-muted-foreground/50 mb-2 h-8 w-8" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
