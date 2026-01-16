'use client'

/**
 * Dashboard Sidebar - 側邊欄元件
 * 📐 Figma: 48:1184
 *
 * Design specs:
 * - Width: 256px
 * - Background: #132337
 * - Border: 1px solid #234567
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bookmark,
  Tag,
  Clock,
  Star,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import type { User } from 'next-auth'

interface DashboardSidebarProps {
  user: User
}

const navItems = [
  {
    label: '所有書籤',
    href: '/bookmarks',
    icon: Bookmark,
  },
  {
    label: '最近新增',
    href: '/bookmarks?sort=recent',
    icon: Clock,
  },
  {
    label: '我的收藏',
    href: '/bookmarks?filter=favorite',
    icon: Star,
  },
  {
    label: '標籤管理',
    href: '/tags',
    icon: Tag,
  },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-background-alt">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Bookmark className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-heading text-lg font-bold text-foreground">
          Clipwise
        </span>
      </div>

      {/* Add Bookmark Button */}
      <div className="p-4">
        <Link
          href="/bookmarks?add=true"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          新增書籤
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '?')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || ''}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            設定
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      </div>
    </aside>
  )
}
