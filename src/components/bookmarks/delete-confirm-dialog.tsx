/**
 * T093: Delete Confirm Dialog - 刪除確認對話框
 * 📐 Figma: 48:2157 | 12b-delete-confirm.html
 *
 * Design specs from Figma:
 * - Dialog: bg-[rgba(19,35,55,0.95)] border-[#234567] rounded-[16px]
 * - Warning icon: Red circle with triangle
 * - Cancel button: bg-transparent
 * - Confirm button: bg-[#ef4444] (red)
 */

'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  bookmarkTitle: string;
  bookmarkDomain?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  bookmarkTitle,
  bookmarkDomain,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#234567] bg-[rgba(19,35,55,0.95)] shadow-2xl backdrop-blur-lg">
        {/* Content */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {/* Warning Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(239,68,68,0.2)]">
            <AlertTriangle className="h-7 w-7 text-[#ef4444]" />
          </div>

          {/* Title */}
          <h2 className="mb-2 text-lg font-bold text-[#e8f0f7]">確定要刪除嗎？</h2>

          {/* Description */}
          <p className="mb-6 text-center text-sm text-[#8892a0]">
            這個動作無法復原，書籤將會永久刪除。
          </p>

          {/* Bookmark Preview */}
          <div className="mb-6 w-full rounded-xl border border-[#234567] bg-[#0a1628] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,212,255,0.2)]">
                <Sparkles className="h-5 w-5 text-[#00d4ff]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#e8f0f7]">{bookmarkTitle}</p>
                {bookmarkDomain && (
                  <p className="truncate text-xs text-[#8892a0]">{bookmarkDomain}</p>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-[#234567] bg-transparent px-5 py-3 text-[#8892a0] hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-xl bg-[#ef4444] px-5 py-3 font-medium text-white',
                'hover:bg-[#ef4444]/90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
