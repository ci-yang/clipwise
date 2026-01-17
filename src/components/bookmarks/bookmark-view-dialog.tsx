/**
 * T093: Bookmark View Dialog - 書籤詳情對話框
 * 📐 Figma: 44:35 | bookmark-detail.html
 *
 * US5: 查看書籤 - 點擊書籤卡片後顯示詳情
 * 從此對話框可以進入 US8 (編輯書籤) 流程
 *
 * Design specs from Figma:
 * - Dialog: max-w-[512px] bg-[rgba(19,35,55,0.95)] border-[#234567] rounded-[16px]
 * - Title: text-[20px] font-bold text-[#e8f0f7]
 * - Summary: text-[#8892a0] text-sm
 * - Tags: bg-[rgba(0,212,255,0.15)] text-[#00d4ff] rounded-lg
 * - URL: bg-[#0a1628] border-[#234567] rounded-xl
 * - Open link: text-[#00d4ff]
 * - Edit button: bg-[#00d4ff] text-[#0a1628]
 */

'use client';

import { useState, useCallback } from 'react';
import { X, Link as LinkIcon, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookmarkWithTags } from '@/services/bookmark.service';

interface BookmarkViewDialogProps {
  bookmark: BookmarkWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function BookmarkViewDialog({
  bookmark,
  open,
  onOpenChange,
  onEdit,
}: BookmarkViewDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bookmark.url]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (!open) return null;

  // Determine display summary
  const displaySummary =
    bookmark.aiStatus === 'COMPLETED' && bookmark.aiSummary
      ? bookmark.aiSummary
      : bookmark.description || null;

  // AI Status text for non-completed states
  const renderAiStatus = () => {
    switch (bookmark.aiStatus) {
      case 'PENDING':
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-2 rounded-xl bg-[rgba(0,212,255,0.1)] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#00d4ff]" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#00d4ff] [animation-delay:150ms]" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#00d4ff] [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-[#00d4ff]">AI 正在產生摘要...</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="rounded-xl bg-[rgba(251,191,36,0.1)] px-4 py-3">
            <span className="text-sm text-[rgba(251,191,36,0.8)]">
              AI 無法處理此連結，您可以手動編輯摘要
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-[512px] overflow-hidden rounded-2xl border border-[#234567] bg-[rgba(19,35,55,0.95)] shadow-2xl backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#234567] px-6 py-4">
          <h2 className="text-lg font-bold text-[#e8f0f7]">書籤詳情</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8892a0] hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex max-h-[60vh] flex-col gap-5 overflow-auto p-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-[#e8f0f7]">{bookmark.title || bookmark.url}</h3>
          </div>

          {/* Summary or AI Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">摘要</label>
            {displaySummary ? (
              <p className="text-sm leading-relaxed text-[#e8f0f7]">{displaySummary}</p>
            ) : (
              renderAiStatus() || <p className="text-sm text-[#8892a0]">尚無摘要</p>
            )}
          </div>

          {/* Tags */}
          {bookmark.tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-light text-[#8892a0]">標籤</label>
              <div className="flex flex-wrap gap-2">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-lg bg-[rgba(0,212,255,0.15)] px-3 py-1.5 text-sm font-light text-[#00d4ff]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">連結</label>
            <div className="flex items-center gap-3 rounded-xl border border-[#234567] bg-[#0a1628] px-4 py-3">
              <LinkIcon className="h-5 w-5 shrink-0 text-[#8892a0]" />
              <span className="flex-1 truncate text-sm text-[#8892a0]">{bookmark.url}</span>
              <button
                onClick={handleCopyUrl}
                className="shrink-0 text-[#00d4ff] hover:text-[#00d4ff]/80"
                title="複製連結"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap gap-6 text-sm text-[#8892a0]">
            <span>新增於 {formatDate(bookmark.createdAt)}</span>
            <span>編輯於 {formatDate(bookmark.updatedAt)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#234567] bg-[rgba(10,22,40,0.3)] px-6 py-4">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#00d4ff] hover:text-[#00d4ff]/80"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="font-light">開啟連結</span>
          </a>

          <button
            onClick={onEdit}
            className={cn(
              'rounded-xl bg-[#00d4ff] px-5 py-2.5 font-medium text-[#0a1628]',
              'hover:bg-[#00d4ff]/90'
            )}
          >
            編輯書籤
          </button>
        </div>
      </div>
    </div>
  );
}
