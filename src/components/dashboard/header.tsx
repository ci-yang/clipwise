/**
 * Dashboard Header - 頂部導航列
 * 📐 Figma: 48:1190 (Desktop), 48:1576 (Mobile)
 *
 * Design specs from Figma:
 * - Desktop: Background rgba(19,35,55,0.5) with backdrop-blur
 * - Mobile: Clipwise logo + search icon
 * - Border: 1px solid #234567
 * - 搜尋功能已移至獨立的 /search 頁面
 */

import Link from 'next/link';
import { Search } from 'lucide-react';
import type { User } from 'next-auth';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#234567] bg-[rgba(19,35,55,0.5)] px-4 py-4 backdrop-blur-sm md:px-8">
      {/* Logo - Figma: 48:1577 */}
      <Link href="/bookmarks">
        <span className="font-['Inter'] text-lg font-bold text-[#00d4ff]">Clipwise</span>
      </Link>

      {/* Right side: Search + Avatar */}
      <div className="flex items-center gap-4">
        {/* Search Icon - Links to /search page */}
        <Link
          href="/search"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8892a0] transition-colors hover:bg-[#234567]/30 hover:text-[#e8f0f7]"
          aria-label="搜尋書籤"
        >
          <Search className="h-5 w-5" />
        </Link>

        {/* User Avatar - Figma: 48:1198 */}
        <div
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white md:flex"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(19, 78, 74, 1) 100%)',
          }}
        >
          {user.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
