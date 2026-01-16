'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-2 focus:ring-offset-[#0a1628] focus:outline-none"
        data-testid="user-menu-trigger"
      >
        <div
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00d4ff] to-[#134e4a]"
          data-testid="user-avatar"
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name || '使用者'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-white">
              {session.user.name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Menu */}
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[#234567] bg-[#132337] shadow-lg">
            {/* User Info */}
            <div className="border-b border-[#234567] px-4 py-3">
              <p className="text-sm font-medium text-[#e8f0f7]">{session.user.name}</p>
              <p className="truncate text-xs text-[#8892a0]">{session.user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-[#e8f0f7]',
                  'hover:bg-[rgba(0,212,255,0.1)]'
                )}
                role="menuitem"
              >
                <Settings className="h-4 w-4 text-[#8892a0]" />
                設定
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-[#e8f0f7]',
                  'hover:bg-[rgba(0,212,255,0.1)]'
                )}
                role="menuitem"
              >
                <User className="h-4 w-4 text-[#8892a0]" />
                個人資料
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-[#234567] py-1">
              <button
                onClick={handleSignOut}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-[#ef4444]',
                  'hover:bg-[rgba(239,68,68,0.1)]'
                )}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                登出
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
