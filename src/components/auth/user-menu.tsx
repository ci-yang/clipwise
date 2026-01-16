'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
        data-testid="user-menu-trigger"
      >
        <div
          className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-secondary to-accent"
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
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
              {session.user.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-border bg-background-alt shadow-lg">
            {/* User Info */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-muted">{session.user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground',
                  'hover:bg-background'
                )}
                role="menuitem"
              >
                <Settings className="h-4 w-4" />
                設定
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground',
                  'hover:bg-background'
                )}
                role="menuitem"
              >
                <User className="h-4 w-4" />
                個人資料
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-border py-1">
              <button
                onClick={handleSignOut}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-danger',
                  'hover:bg-background'
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
  )
}
