/**
 * BookmarkInputDialog - 可控制的新增書籤對話框
 * 用於 Mobile FAB 按鈕觸發
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Link2, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BookmarkInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BookmarkInputDialog({ open, onOpenChange, onSuccess }: BookmarkInputDialogProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setUrl('');
    setError(null);
  }, [onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('請輸入網址');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('請輸入有效的網址');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('請先登入');
          router.push('/login');
          return;
        }
        if (response.status === 429) {
          setError(`請求過於頻繁，請 ${data.retryAfter || 60} 秒後再試`);
          return;
        }
        setError(data.error || '建立書籤失敗');
        return;
      }

      // Success
      if (response.status === 200) {
        toast.info('此連結已存在書籤中', {
          description: data.title || url,
        });
      } else {
        toast.success('書籤已新增', {
          description: 'AI 正在分析內容...',
          icon: <Sparkles className="h-4 w-4" />,
        });
      }

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating bookmark:', err);
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
      }
    } catch {
      // Clipboard access denied, ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent
        className="border-border bg-[rgba(19,35,55,0.95)] backdrop-blur-xl sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Link2 className="text-primary h-5 w-5" />
              新增書籤
            </DialogTitle>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="bookmark-url-dialog" className="text-foreground text-sm font-medium">
              網址
            </label>
            <div className="relative">
              <input
                id="bookmark-url-dialog"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://example.com"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border px-4 pr-20 focus:ring-2 focus:outline-none"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="bg-muted text-muted-foreground hover:bg-border hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                disabled={isSubmitting}
              >
                貼上
              </button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          {/* AI Info */}
          <div className="border-primary/20 bg-primary/5 rounded-xl border p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                AI 將自動擷取標題、摘要，並產生相關標籤，讓你更快找到需要的內容。
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
              disabled={isSubmitting || !url.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                '新增書籤'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
