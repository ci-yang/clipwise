/**
 * T097: MobileNav - 行動版底部導航列
 * 📐 Figma: 48:1570 | 02-dashboard.html (390w)
 *
 * Design specs from Figma:
 * - Bottom Tab Bar: h-16 bg-[#132337] border-t border-[#234567]
 * - FAB: w-14 h-14 bg-[#00d4ff] rounded-full shadow
 * - Active tab: text-[#00d4ff], Inactive: text-[#8892a0]
 */

'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Search, Tag, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookmarkInputDialog } from '@/components/bookmarks/bookmark-input-dialog';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Bookmark;
}

const navItems: NavItem[] = [
  { label: '書籤', href: '/bookmarks', icon: Bookmark },
  { label: '搜尋', href: '/search', icon: Search },
  // FAB placeholder
  { label: '標籤', href: '/tags', icon: Tag },
  { label: '設定', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/bookmarks') {
        return pathname === '/bookmarks' || pathname?.startsWith('/bookmarks/');
      }
      return pathname === href;
    },
    [pathname]
  );

  const handleAddSuccess = useCallback(() => {
    setIsAddOpen(false);
  }, []);

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#234567] bg-[#132337] md:hidden">
        <div className="flex h-16 items-center">
          {/* Left side nav items */}
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1',
                isActive(item.href) ? 'text-[#00d4ff]' : 'text-[#8892a0]'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}

          {/* FAB Button */}
          <div className="relative h-8 w-14">
            <button
              onClick={() => setIsAddOpen(true)}
              className="absolute left-0 top-[-24px] flex h-14 w-14 items-center justify-center rounded-full bg-[#00d4ff] shadow-[0px_10px_15px_-3px_rgba(0,212,255,0.3),0px_4px_6px_-4px_rgba(0,212,255,0.3)] transition-transform hover:scale-105 active:scale-95"
              aria-label="新增書籤"
            >
              <Plus className="h-6 w-6 text-[#0a1628]" />
            </button>
          </div>

          {/* Right side nav items */}
          {navItems.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1',
                isActive(item.href) ? 'text-[#00d4ff]' : 'text-[#8892a0]'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Add Bookmark Dialog */}
      <BookmarkInputDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}
