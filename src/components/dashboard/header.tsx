'use client';

/**
 * Dashboard Header - 頂部搜尋與操作列
 * 📐 Figma: 48:1190
 *
 * Design specs from Figma:
 * - Background: rgba(19,35,55,0.5) with backdrop-blur
 * - Border: 1px solid #234567
 * - Search input: max-w-[608px] bg-[#0a1628] border-[#234567]
 * - User avatar: 36x36 with gradient background
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { User } from 'next-auth';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

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
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#234567] bg-[rgba(19,35,55,0.5)] px-8 py-4 backdrop-blur-sm">
      {/* Search - Figma: 48:1191 */}
      <form onSubmit={handleSearch} className="w-full max-w-[608px] px-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#8892a0]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋書籤..."
            className="h-[46px] w-full rounded-xl border border-[#234567] bg-[#0a1628] pr-4 pl-12 text-base font-light text-[#e8f0f7] placeholder:text-[#8892a0] focus:border-[#00d4ff] focus:outline-none"
          />
        </div>
      </form>

      {/* User Avatar - Figma: 48:1198 */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(19, 78, 74, 1) 100%)',
        }}
      >
        {user.name?.charAt(0) || 'U'}
      </div>
    </header>
  );
}
