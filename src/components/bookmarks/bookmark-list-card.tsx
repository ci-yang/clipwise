/**
 * Bookmark List Card - 書籤列表卡片元件
 * 📐 Figma: 48:1221 | 02-dashboard.html
 *
 * Design specs from Figma:
 * - Card: h-[178px] bg-[#132337] border-[#234567] rounded-[16px]
 * - Favicon/Emoji: 32x32 with colored background
 * - Domain + timestamp: text-[#8892a0] text-sm
 * - Title: text-[#e8f0f7] text-[16px] font-medium
 * - Summary: text-[#8892a0] text-sm
 * - AI tags: bg-[rgba(0,212,255,0.15)] text-[#00d4ff]
 * - Custom tags: bg-[rgba(19,78,74,0.3)] text-[#34d399]
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExternalLink, MoreHorizontal, Pencil, Trash2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookmarkViewDialog } from './bookmark-view-dialog';
import { BookmarkEditDialog } from './bookmark-edit-dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import type { BookmarkWithTags } from '@/services/bookmark.service';

interface BookmarkListCardProps {
  bookmark: BookmarkWithTags;
  onUpdate?: (bookmark: BookmarkWithTags) => void;
  onDelete?: (bookmarkId: string) => void;
}

// Emoji backgrounds based on domain category
const getDomainStyle = (domain: string): { emoji: string; bgColor: string } => {
  const domainStyles: Record<string, { emoji: string; bgColor: string }> = {
    'github.com': { emoji: '🔥', bgColor: 'rgba(249,115,22,0.2)' },
    'medium.com': { emoji: '📘', bgColor: 'rgba(59,130,246,0.2)' },
    'vercel.com': { emoji: '⚡', bgColor: 'rgba(168,85,247,0.2)' },
    'tailwindcss.com': { emoji: '🎨', bgColor: 'rgba(34,197,94,0.2)' },
    'dev.to': { emoji: '🚀', bgColor: 'rgba(239,68,68,0.2)' },
    'nodejs.org': { emoji: '📚', bgColor: 'rgba(234,179,8,0.2)' },
  };

  return domainStyles[domain] || { emoji: '🔗', bgColor: 'rgba(136,146,160,0.2)' };
};

// Simple relative time formatter
const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffWeeks < 4) return `${diffWeeks} 週前`;
  return target.toLocaleDateString('zh-TW');
};

export function BookmarkListCard({
  bookmark: initialBookmark,
  onUpdate,
  onDelete,
}: BookmarkListCardProps) {
  // Local bookmark state for immediate updates
  const [bookmark, setBookmark] = useState<BookmarkWithTags>(initialBookmark);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const domainStyle = getDomainStyle(bookmark.domain || '');

  // Poll for AI status updates if still processing
  useEffect(() => {
    // Only poll if AI is still processing and not stale
    if (bookmark.aiStatus !== 'PENDING' && bookmark.aiStatus !== 'PROCESSING') {
      return;
    }

    // Check if stale (more than 5 minutes old)
    const createdAt = new Date(bookmark.createdAt);
    const diffMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);
    if (diffMinutes > 5) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/status/${bookmark.id}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.status !== bookmark.aiStatus || data.summary !== bookmark.aiSummary) {
          // Re-fetch full bookmark data to get tags
          const bookmarkResponse = await fetch(`/api/bookmarks/${bookmark.id}`);
          if (bookmarkResponse.ok) {
            const result = await bookmarkResponse.json();
            // API returns { bookmark: {...} } format
            const updatedBookmark = result.bookmark;
            if (updatedBookmark && updatedBookmark.tags) {
              setBookmark(updatedBookmark);
              if (onUpdate) {
                onUpdate(updatedBookmark);
              }
            }
          }
        }

        // Stop polling if AI is done
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('AI status poll error:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [bookmark.id, bookmark.aiStatus, bookmark.aiSummary, bookmark.createdAt, onUpdate]);

  const formatTime = useCallback((date: Date | string) => {
    try {
      return formatRelativeTime(date);
    } catch {
      return '';
    }
  }, []);

  const handleSave = useCallback(
    async (data: { title: string; description: string; tags: string[] }) => {
      // Update bookmark
      const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, description: data.description }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      // Update tags
      const tagsResponse = await fetch(`/api/bookmarks/${bookmark.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: data.tags }),
      });

      // Get updated bookmark data
      await response.json(); // consume the response
      const tagsResult = tagsResponse.ok ? await tagsResponse.json() : null;

      // Update local bookmark state immediately
      const updatedBookmark: BookmarkWithTags = {
        ...bookmark,
        title: data.title,
        description: data.description,
        updatedAt: new Date(),
        tags: tagsResult?.bookmark?.tags || bookmark.tags,
      };
      setBookmark(updatedBookmark);

      // Close edit dialog and re-open view dialog
      setIsEditOpen(false);
      setIsViewOpen(true);

      // Notify parent
      if (onUpdate) {
        onUpdate(updatedBookmark);
      }
    },
    [bookmark, onUpdate]
  );

  const handleDelete = useCallback(async () => {
    const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete bookmark');
    }

    // Close all dialogs
    setIsDeleteOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);

    // Notify parent to remove from list
    if (onDelete) {
      onDelete(bookmark.id);
    }
  }, [bookmark.id, onDelete]);

  const openViewDialog = useCallback(() => {
    setIsMenuOpen(false);
    setIsViewOpen(true);
  }, []);

  const openEditDialog = useCallback(() => {
    setIsMenuOpen(false);
    setIsViewOpen(false);
    setIsEditOpen(true);
  }, []);

  // Cancel editing and return to view dialog
  const handleEditCancel = useCallback(() => {
    setIsEditOpen(false);
    setIsViewOpen(true);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setIsMenuOpen(false);
    setIsDeleteOpen(true);
  }, []);

  // Check if bookmark is stale (pending for more than 5 minutes)
  const isStale = () => {
    if (bookmark.aiStatus !== 'PENDING' && bookmark.aiStatus !== 'PROCESSING') {
      return false;
    }
    const createdAt = new Date(bookmark.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes > 5;
  };

  // AI Status indicator
  const renderAiStatus = () => {
    // If pending/processing for more than 5 minutes, show as failed
    if (isStale()) {
      return <span className="text-sm text-[rgba(251,191,36,0.8)]">AI 處理逾時</span>;
    }

    switch (bookmark.aiStatus) {
      case 'PENDING':
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-2">
            <div className="bg-secondary h-1.5 w-1.5 animate-pulse rounded-full" />
            <div className="bg-secondary h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
            <div className="bg-secondary h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
            <span className="text-secondary ml-1 text-sm">AI 正在產生摘要...</span>
          </div>
        );
      case 'FAILED':
        return <span className="text-sm text-[rgba(251,191,36,0.8)]">AI 無法處理此連結</span>;
      default:
        return null;
    }
  };

  // Tags rendering
  const renderTags = () => {
    // If tags exist, show them regardless of AI status
    if (bookmark.tags.length > 0) {
      return bookmark.tags.slice(0, 3).map((tag) => (
        <span
          key={tag.id}
          className={cn(
            'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-light',
            'isAiGenerated' in tag && tag.isAiGenerated
              ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
              : 'bg-[rgba(19,78,74,0.3)] text-[#34d399]'
          )}
        >
          {tag.name}
        </span>
      ));
    }

    // Only show loading if AI is processing, not stale, and no tags exist yet
    if (
      (bookmark.aiStatus === 'PENDING' || bookmark.aiStatus === 'PROCESSING') &&
      !isStale()
    ) {
      return (
        <span className="inline-flex items-center rounded-lg bg-[rgba(136,146,160,0.2)] px-2.5 py-1 text-xs text-[#8892a0]">
          載入中
        </span>
      );
    }

    // No tags and AI is done or stale
    return (
      <span className="inline-flex items-center rounded-lg bg-[rgba(136,146,160,0.2)] px-2.5 py-1 text-xs text-[#8892a0]">
        未分類
      </span>
    );
  };

  return (
    <article className="group relative h-[178px] overflow-hidden rounded-2xl border border-[#234567] bg-[#132337] transition-all hover:border-[#00d4ff]/50 hover:shadow-lg hover:shadow-[#00d4ff]/5">
      {/* Header: Favicon + Domain + Timestamp */}
      <div className="absolute top-5 right-5 left-5 flex items-center gap-3">
        {/* Favicon/Emoji */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: domainStyle.bgColor }}
        >
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="h-4 w-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <span className="text-lg">{domainStyle.emoji}</span>
          )}
          <Globe className="hidden h-4 w-4 text-[#e8f0f7]" />
        </div>

        {/* Domain */}
        <span className="overflow-hidden text-sm text-ellipsis whitespace-nowrap text-[#8892a0]">
          {bookmark.domain}
        </span>

        {/* Timestamp */}
        <span className="ml-auto shrink-0 text-xs text-[#8892a0]">
          {formatTime(bookmark.createdAt)}
        </span>
      </div>

      {/* Title */}
      <div className="absolute top-16 right-5 left-5">
        <h3 className="line-clamp-1 text-base font-medium text-[#e8f0f7]">
          {bookmark.title || bookmark.url}
        </h3>
      </div>

      {/* Summary or AI Status */}
      <div className="absolute top-24 right-5 left-5">
        {bookmark.aiStatus === 'COMPLETED' && bookmark.aiSummary ? (
          <p className="line-clamp-1 text-sm font-light text-[#8892a0]">{bookmark.aiSummary}</p>
        ) : (
          renderAiStatus()
        )}
      </div>

      {/* Tags */}
      <div className="absolute right-5 bottom-5 left-5 flex flex-wrap gap-2">{renderTags()}</div>

      {/* Actions Overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#132337]/90 text-[#8892a0] backdrop-blur-sm transition-colors hover:bg-[#132337] hover:text-[#e8f0f7]"
          title="開啟連結"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#132337]/90 text-[#8892a0] backdrop-blur-sm transition-colors hover:bg-[#132337] hover:text-[#e8f0f7]"
          title="更多選項"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-12 right-2 z-20 w-36 rounded-xl border border-[#234567] bg-[#132337] p-1 shadow-lg">
            <button
              onClick={openEditDialog}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#8892a0] hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
            >
              <Pencil className="h-4 w-4" />
              編輯
            </button>
            <button
              onClick={openDeleteDialog}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              刪除
            </button>
          </div>
        </>
      )}

      {/* Click Area - Opens View Dialog (US5: 查看書籤) */}
      <button
        onClick={openViewDialog}
        className="absolute inset-0 z-0"
        aria-label={`查看 ${bookmark.title || bookmark.url}`}
      />

      {/* View Dialog (US5) */}
      <BookmarkViewDialog
        bookmark={bookmark}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={openEditDialog}
      />

      {/* Edit Dialog (US8) */}
      <BookmarkEditDialog
        bookmark={bookmark}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSave}
        onDelete={openDeleteDialog}
        onCancel={handleEditCancel}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        bookmarkTitle={bookmark.title || bookmark.url}
        bookmarkDomain={bookmark.domain || undefined}
      />
    </article>
  );
}
