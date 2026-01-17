/**
 * T092: Bookmark Edit Dialog - 書籤編輯對話框
 * 📐 Figma: 44:78 | 12-edit-bookmark.html
 *
 * Design specs from Figma:
 * - Dialog: max-w-[512px] bg-[rgba(19,35,55,0.95)] border-[#234567] rounded-[16px]
 * - Input: bg-[#0a1628] border-[#234567] rounded-[12px]
 * - Tags: bg-[rgba(0,212,255,0.2)] text-[#00d4ff]
 * - Delete button: text-[#ef4444]
 * - Save button: bg-[#00d4ff] text-[#0a1628]
 */

'use client';

import { useState, useCallback } from 'react';
import { X, Link as LinkIcon, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookmarkWithTags } from '@/services/bookmark.service';

interface BookmarkEditDialogProps {
  bookmark: BookmarkWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; description: string; tags: string[] }) => Promise<void>;
  onDelete: () => void;
  /** Called when cancel is clicked - returns to previous view */
  onCancel?: () => void;
}

export function BookmarkEditDialog({
  bookmark,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onCancel,
}: BookmarkEditDialogProps) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [description, setDescription] = useState(bookmark.description || bookmark.aiSummary || '');
  const [tags, setTags] = useState<string[]>(bookmark.tags.map((t) => t.name));
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bookmark.url]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave({ title, description, tags });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  }, [title, description, tags, onSave, onOpenChange]);

  if (!open) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
          <h2 className="text-lg font-bold text-[#e8f0f7]">編輯書籤</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8892a0] hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 overflow-auto p-6">
          {/* URL (Read-only) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">連結</label>
            <div className="flex items-center gap-3 rounded-xl border border-[#234567] bg-[#0a1628] px-4 py-3">
              <LinkIcon className="h-5 w-5 shrink-0 text-[#8892a0]" />
              <span className="flex-1 truncate text-[#8892a0]">{bookmark.url}</span>
              <button
                onClick={handleCopyUrl}
                className="shrink-0 text-sm font-light text-[#00d4ff] hover:text-[#00d4ff]/80"
              >
                {copied ? '已複製' : '複製'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-[#234567] bg-[#0a1628] px-4 py-3 text-[#e8f0f7] placeholder:text-[#8892a0] focus:border-[#00d4ff] focus:outline-none"
              placeholder="輸入標題"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">摘要</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-xl border border-[#234567] bg-[#0a1628] px-4 py-3 text-[#e8f0f7] placeholder:text-[#8892a0] focus:border-[#00d4ff] focus:outline-none"
              placeholder="輸入摘要"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-light text-[#8892a0]">標籤</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(0,212,255,0.2)] px-3 py-1.5 text-sm font-light text-[#00d4ff]"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#234567] px-3 py-1.5">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-20 bg-transparent text-sm text-[#e8f0f7] placeholder:text-[#8892a0] focus:outline-none"
                  placeholder="新增標籤"
                />
                <button
                  onClick={handleAddTag}
                  className="text-[#8892a0] hover:text-[#00d4ff]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
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
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-[#ef4444] hover:text-[#ef4444]/80"
          >
            <Trash2 className="h-4 w-4" />
            <span className="font-light">刪除書籤</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  onOpenChange(false);
                }
              }}
              className="px-5 py-2.5 font-light text-[#8892a0] hover:text-[#e8f0f7]"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={cn(
                'rounded-xl bg-[#00d4ff] px-5 py-2.5 font-medium text-[#0a1628]',
                'hover:bg-[#00d4ff]/90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
