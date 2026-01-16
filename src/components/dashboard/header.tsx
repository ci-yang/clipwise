'use client'

/**
 * Dashboard Header - 頂部搜尋與操作列
 * 📐 Figma: 48:1184
 *
 * Design specs:
 * - Height: 64px
 * - Background: transparent (inherits from page)
 * - Search input with glassmorphism effect
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { User } from 'next-auth'

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const { theme, setTheme } = useTheme()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/bookmarks?${params.toString()}`)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <form onSubmit={handleSearch} className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋書籤..."
            className="h-10 w-full rounded-xl border border-border bg-background-alt pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="切換主題"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="通知"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User Avatar (Mobile) */}
        <div className="ml-2 lg:hidden">
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
        </div>
      </div>
    </header>
  )
}
