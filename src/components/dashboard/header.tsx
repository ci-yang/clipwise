'use client';

/**
 * Dashboard Header - 頂部搜尋與操作列
 * 📐 Figma: 48:1184
 *
 * Design specs:
 * - Height: 64px
 * - Background: transparent (inherits from page)
 * - Search input with glassmorphism effect
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { User } from 'next-auth';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`/bookmarks?${params.toString()}`);
  };

  return (
    <header className="border-border bg-background/80 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm">
      {/* Search */}
      <form onSubmit={handleSearch} className="w-full max-w-md">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋書籤..."
            className="border-border bg-background-alt text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary h-10 w-full rounded-xl border pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          aria-label="切換主題"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          aria-label="通知"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User Avatar (Mobile) */}
        <div className="ml-2 lg:hidden">
          {user.image ? (
            <img src={user.image} alt={user.name || ''} className="h-8 w-8 rounded-full" />
          ) : (
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
