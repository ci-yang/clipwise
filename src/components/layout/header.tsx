'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8',
        className
      )}
    >
      {/* Left Section: Logo & Menu */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="開啟選單"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text font-heading text-xl font-bold text-transparent">
            Clipwise
          </span>
        </Link>
      </div>

      {/* Center Section: Search (Desktop) */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="搜尋書籤..."
            className="h-10 w-full rounded-lg border border-border bg-background-alt pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Right Section: User */}
      <div className="flex items-center gap-4">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="搜尋"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* User Avatar */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted lg:inline">
              {session.user.name}
            </span>
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-secondary to-accent">
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
          </div>
        )}
      </div>
    </header>
  )
}
