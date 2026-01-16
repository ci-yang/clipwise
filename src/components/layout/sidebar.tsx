'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Tag, Settings, LogOut, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const navItems = [
  {
    label: '所有書籤',
    href: '/bookmarks',
    icon: Bookmark,
  },
  {
    label: '標籤',
    href: '/bookmarks?view=tags',
    icon: Tag,
  },
  {
    label: '設定',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'border-border bg-background-alt fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Mobile Header */}
        <div className="border-border flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <span className="from-secondary to-accent font-heading bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
            Clipwise
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="關閉選單">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/bookmarks' && pathname?.startsWith('/bookmarks'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-muted hover:bg-background hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tags Section (placeholder) */}
        <div className="border-border border-t p-4">
          <h3 className="text-muted mb-3 text-xs font-semibold tracking-wider uppercase">標籤</h3>
          <div className="space-y-1">
            <p className="text-muted text-sm">尚無標籤</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="border-border border-t p-4">
          <button
            onClick={handleSignOut}
            className="text-muted hover:bg-background hover:text-danger flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>登出</span>
          </button>
        </div>
      </aside>
    </>
  );
}
