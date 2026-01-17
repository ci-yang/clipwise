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

import { useState, useCallback } from 'react';
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function BookmarkListCard({ bookmark, onUpdate, onDelete }: BookmarkListCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const domainStyle = getDomainStyle(bookmark.domain || '');

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
      await fetch(`/api/bookmarks/${bookmark.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: data.tags }),
      });

      // Notify parent
      if (onUpdate) {
        const result = await response.json();
        onUpdate(result.bookmark);
      }
    },
    [bookmark.id, onUpdate]
  );

  const handleDelete = useCallback(async () => {
    const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete bookmark');
    }

    // Notify parent
    if (onDelete) {
      onDelete(bookmark.id);
    }
  }, [bookmark.id, onDelete]);

  const openEditDialog = useCallback(() => {
    setIsMenuOpen(false);
    setIsEditOpen(true);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setIsMenuOpen(false);
    setIsDeleteOpen(true);
  }, []);

  // AI Status indicator
  const renderAiStatus = () => {
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
        return (
          <span className="text-sm text-[rgba(251,191,36,0.8)]">AI 無法處理此連結</span>
        );
      default:
        return null;
    }
  };

  // Tags rendering
  const renderTags = () => {
    if (bookmark.aiStatus === 'PENDING' || bookmark.aiStatus === 'PROCESSING') {
      return (
        <span className="inline-flex items-center rounded-lg bg-[rgba(136,146,160,0.2)] px-2.5 py-1 text-xs text-[#8892a0]">
          載入中
        </span>
      );
    }

    if (bookmark.tags.length === 0) {
      return (
        <span className="inline-flex items-center rounded-lg bg-[rgba(136,146,160,0.2)] px-2.5 py-1 text-xs text-[#8892a0]">
          未分類
        </span>
      );
    }

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
  };

  return (
    <article className="group relative h-[178px] overflow-hidden rounded-2xl border border-[#234567] bg-[#132337] transition-all hover:border-[#00d4ff]/50 hover:shadow-lg hover:shadow-[#00d4ff]/5">
      {/* Header: Favicon + Domain + Timestamp */}
      <div className="absolute left-5 right-5 top-5 flex items-center gap-3">
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
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#8892a0]">
          {bookmark.domain}
        </span>

        {/* Timestamp */}
        <span className="ml-auto shrink-0 text-xs text-[#8892a0]">
          {formatTime(bookmark.createdAt)}
        </span>
      </div>

      {/* Title */}
      <div className="absolute left-5 right-5 top-16">
        <h3 className="line-clamp-1 text-base font-medium text-[#e8f0f7]">
          {bookmark.title || bookmark.url}
        </h3>
      </div>

      {/* Summary or AI Status */}
      <div className="absolute left-5 right-5 top-24">
        {bookmark.aiStatus === 'COMPLETED' && bookmark.aiSummary ? (
          <p className="line-clamp-1 text-sm font-light text-[#8892a0]">
            {bookmark.aiSummary}
          </p>
        ) : (
          renderAiStatus()
        )}
      </div>

      {/* Tags */}
      <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
        {renderTags()}
      </div>

      {/* Actions Overlay */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
          <div className="absolute right-2 top-12 z-20 w-36 rounded-xl border border-[#234567] bg-[#132337] p-1 shadow-lg">
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

      {/* Click Area - Opens Edit Dialog */}
      <button
        onClick={openEditDialog}
        className="absolute inset-0 z-0"
        aria-label={`編輯 ${bookmark.title || bookmark.url}`}
      />

      {/* Edit Dialog */}
      <BookmarkEditDialog
        bookmark={bookmark}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSave}
        onDelete={openDeleteDialog}
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
