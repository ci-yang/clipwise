/**
 * Search Result Card - 搜尋結果卡片
 * 📐 Figma: 29:410 | 10-search-results.html
 *
 * Design specs from Figma:
 * - Card: bg-[#132337] border-[#234567] rounded-xl
 * - Domain icon: 48x48 with colored background
 * - Highlight: bg-[rgba(251,191,36,0.3)] text-[#fbbf24] (yellow)
 * - Title: text-[#e8f0f7] text-base font-medium
 * - Summary: text-[#8892a0] text-sm
 * - Tags: AI tags cyan, custom tags green
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractSearchTerms } from '@/lib/search';
import type { BookmarkWithTags } from '@/services/bookmark.service';

interface SearchResultCardProps {
  bookmark: BookmarkWithTags;
  query: string;
}

// Domain styles (same as bookmark-list-card)
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

// Highlight component with Figma design - yellow background
function HighlightText({
  text,
  query,
  className,
  maxLength,
}: {
  text: string;
  query: string;
  className?: string;
  maxLength?: number;
}) {
  const highlighted = useMemo(() => {
    if (!text) return null;
    if (!query) return text.slice(0, maxLength || text.length);

    const terms = extractSearchTerms(query);
    if (terms.length === 0) return text.slice(0, maxLength || text.length);

    // Escape regex special chars
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');

    // Find first match position
    let displayText = text;
    if (maxLength && text.length > maxLength) {
      const match = text.match(pattern);
      if (match) {
        const firstMatchIndex = text.toLowerCase().indexOf(match[0].toLowerCase());
        const start = Math.max(0, firstMatchIndex - 30);
        const end = Math.min(text.length, start + maxLength);
        displayText =
          (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
      } else {
        displayText = text.slice(0, maxLength) + '...';
      }
    }

    // Split and highlight
    const parts = displayText.split(pattern);
    return parts.map((part, index) => {
      const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());
      if (isMatch) {
        return (
          <mark key={index} className="rounded bg-[rgba(251,191,36,0.3)] px-0.5 text-[#fbbf24]">
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [text, query, maxLength]);

  return <span className={className}>{highlighted}</span>;
}

export function SearchResultCard({ bookmark, query }: SearchResultCardProps) {
  const domainStyle = getDomainStyle(bookmark.domain || '');
  const summary = bookmark.aiSummary || bookmark.description || '';

  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#234567] bg-[#132337] p-4 transition-all hover:border-[#00d4ff]/50 hover:shadow-lg hover:shadow-[#00d4ff]/5">
      <div className="flex gap-4">
        {/* Domain Icon - Figma: 48x48 */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: domainStyle.bgColor }}
        >
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <span className="text-2xl">{domainStyle.emoji}</span>
          )}
          <Globe className="hidden h-6 w-6 text-[#e8f0f7]" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title with highlight */}
          <h3 className="mb-1 line-clamp-1 text-base font-medium text-[#e8f0f7]">
            <HighlightText text={bookmark.title || bookmark.url} query={query} />
          </h3>

          {/* Summary with highlight */}
          {summary && (
            <p className="mb-3 line-clamp-2 text-sm font-light text-[#8892a0]">
              <HighlightText text={summary} query={query} maxLength={150} />
            </p>
          )}

          {/* Footer: Domain + Timestamp + Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Domain */}
            <span className="text-xs text-[#8892a0]">{bookmark.domain}</span>
            <span className="text-xs text-[#8892a0]">•</span>
            {/* Timestamp */}
            <span className="text-xs text-[#8892a0]">{formatRelativeTime(bookmark.createdAt)}</span>

            {/* Tags */}
            {bookmark.tags.length > 0 && (
              <>
                <span className="text-xs text-[#8892a0]">•</span>
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs',
                      'isAiGenerated' in tag && tag.isAiGenerated
                        ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                        : 'bg-[rgba(19,78,74,0.3)] text-[#34d399]'
                    )}
                  >
                    {tag.name}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* External Link */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8892a0] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
          title="開啟連結"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Click Area - Opens Bookmark Page */}
      <Link
        href={`/bookmarks?highlight=${bookmark.id}`}
        className="absolute inset-0 z-0"
        aria-label={`查看 ${bookmark.title || bookmark.url}`}
      />
    </article>
  );
}
