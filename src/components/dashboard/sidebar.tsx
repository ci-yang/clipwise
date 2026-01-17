'use client';

/**
 * Dashboard Sidebar - 側邊欄元件
 * 📐 Figma: 48:1184 (48:1356)
 *
 * Design specs from Figma:
 * - Width: 256px
 * - Background: #132337
 * - Border: 1px solid #234567
 * - Logo: "Clipwise" text only, #00d4ff
 * - Nav items: 書籤, 搜尋, 標籤, 設定
 * - No "新增書籤" button (moved to main content header)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { User } from 'next-auth';

interface DashboardSidebarProps {
  user: User;
}

// Nav items matching Figma design (48:1360-48:1367)
const navItems = [
  {
    label: '書籤',
    href: '/bookmarks',
  },
  {
    label: '搜尋',
    href: '/search',
  },
  {
    label: '標籤',
    href: '/tags',
  },
  {
    label: '設定',
    href: '/settings',
  },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-[#234567] bg-[#132337]">
      {/* Logo - Figma: 48:1358 */}
      <div className="flex h-[77px] items-center border-b border-[#234567] px-6">
        <span className="font-['Inter'] text-xl font-bold text-[#00d4ff]">Clipwise</span>
      </div>

      {/* Navigation - Figma: 48:1359 */}
      <nav className="flex-1 space-y-1 px-4 pt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '?');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-xl px-4 py-3 text-base transition-colors',
                isActive
                  ? 'bg-[rgba(0,212,255,0.1)] font-medium text-[#00d4ff]'
                  : 'font-light text-[#8892a0] hover:bg-[rgba(0,212,255,0.05)] hover:text-[#e8f0f7]'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section - Figma: 48:1368 */}
      <div className="border-t border-[#234567] px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar - Figma: 48:1370 */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(19, 78, 74, 1) 100%)',
            }}
          >
            {user.name?.charAt(0) || 'U'}
          </div>
          {/* User Info - Figma: 48:1372 */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#e8f0f7]">{user.name}</p>
            <p className="truncate text-xs font-light text-[#8892a0]">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
