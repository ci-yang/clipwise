/**
 * Dashboard Layout - 書籤管理介面佈局
 * 包含側邊欄和主要內容區域
 *
 * 響應式設計（US9）：
 * - Mobile (<768px): 底部 Tab Bar + FAB，無側邊欄
 * - Tablet (768-1023px): 側邊欄（Icon Only, w-16）
 * - Desktop (≥1024px): 側邊欄（文字導航, w-64）
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar - Hidden on mobile, Icon-only on tablet, Full on desktop */}
      <div className="hidden md:block">
        <DashboardSidebar user={session.user} />
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <DashboardHeader user={session.user} />

        {/* Page Content - Add bottom padding on mobile for nav bar */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
