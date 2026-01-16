'use client'

/**
 * Bookmark Card - 書籤卡片元件
 * T045: 建立 src/components/bookmarks/bookmark-card.tsx
 * 📐 Figma: 48:1184
 *
 * Design specs:
 * - Background: #132337
 * - Border: 1px solid #234567
 * - Border radius: 16px
 * - Height: 178px (flexible)
 * - AI tags: bg-[rgba(0,212,255,0.15)] text-[#00d4ff]
 * - Custom tags: bg-[rgba(19,78,74,0.3)] text-[#34d399]
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  MoreHorizontal,
  Star,
  Trash2,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookmarkWithTags } from '@/services/bookmark.service'

interface BookmarkCardProps {
  bookmark: BookmarkWithTags
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // AI Status badge
  const renderAiStatus = () => {
    switch (bookmark.aiStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            處理中
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3 animate-pulse" />
            AI 分析中
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-xs font-medium text-success">
            <Sparkles className="h-3 w-3" />
            AI 完成
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            處理失敗
          </span>
        )
      default:
        return null
    }
  }

  return (
    <article className="group relative flex h-[178px] flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Thumbnail or Gradient */}
      <div className="relative h-16 shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {bookmark.thumbnail && (
          <img
            src={bookmark.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        {/* Favicon */}
        {bookmark.favicon && (
          <div className="absolute bottom-2 left-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card shadow-sm">
            <img
              src={bookmark.favicon}
              alt=""
              className="h-4 w-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        {/* AI Status */}
        <div className="absolute right-2 top-2">{renderAiStatus()}</div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
          {bookmark.title || bookmark.url}
        </h3>

        {/* Domain */}
        <p className="mb-2 text-xs text-muted-foreground">{bookmark.domain}</p>

        {/* Tags */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {bookmark.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={cn(
                'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium',
                'isAiGenerated' in tag && tag.isAiGenerated
                  ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                  : 'bg-[rgba(19,78,74,0.3)] text-[#34d399]'
              )}
            >
              {tag.name}
            </span>
          ))}
          {bookmark.tags.length > 3 && (
            <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{bookmark.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Actions Overlay */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
          title="開啟連結"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
          title="更多選項"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-2 top-12 z-20 w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Star className="h-4 w-4" />
              收藏
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
              刪除
            </button>
          </div>
        </>
      )}

      {/* Click Area Link */}
      <Link
        href={`/bookmarks/${bookmark.id}`}
        className="absolute inset-0 z-0"
        aria-label={`查看 ${bookmark.title || bookmark.url} 詳情`}
      />
    </article>
  )
}
