'use client'

/**
 * Bookmark Input - 新增書籤 Modal
 * T044: 建立 src/components/bookmarks/bookmark-input.tsx
 * 📐 Figma: 44:351
 *
 * Design specs:
 * - Modal with backdrop-blur
 * - Background: rgba(19,35,55,0.95)
 * - Border: 1px solid #234567
 * - Border radius: 16px
 * - Input focused: border #00d4ff
 */

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Link2, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BookmarkInputProps {
  children?: ReactNode
  defaultOpen?: boolean
}

export function BookmarkInput({
  children,
  defaultOpen = false,
}: BookmarkInputProps) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close modal on escape or when URL param changes
  useEffect(() => {
    if (defaultOpen) {
      setOpen(true)
    }
  }, [defaultOpen])

  const handleClose = () => {
    setOpen(false)
    setUrl('')
    setError(null)
    // Remove ?add=true from URL
    if (defaultOpen) {
      router.push('/bookmarks')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('請輸入網址')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('請輸入有效的網址')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('請先登入')
          router.push('/login')
          return
        }
        if (response.status === 429) {
          setError(`請求過於頻繁，請 ${data.retryAfter || 60} 秒後再試`)
          return
        }
        setError(data.error || '建立書籤失敗')
        return
      }

      // Success
      if (response.status === 200) {
        // Bookmark already exists
        toast.info('此連結已存在書籤中', {
          description: data.title || url,
        })
      } else {
        toast.success('書籤已新增', {
          description: 'AI 正在分析內容...',
          icon: <Sparkles className="h-4 w-4" />,
        })
      }

      handleClose()
      router.refresh()
    } catch (err) {
      console.error('Error creating bookmark:', err)
      setError('網路錯誤，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text)
        setError(null)
      }
    } catch {
      // Clipboard access denied, ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(v) : handleClose())}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="border-border bg-[rgba(19,35,55,0.95)] backdrop-blur-xl sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Link2 className="h-5 w-5 text-primary" />
              新增書籤
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label
              htmlFor="bookmark-url"
              className="text-sm font-medium text-foreground"
            >
              網址
            </label>
            <div className="relative">
              <input
                id="bookmark-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
                placeholder="https://example.com"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                disabled={isSubmitting}
              >
                貼上
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* AI Info */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
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
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
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
  )
}
