/**
 * Settings Page - 設定頁面
 * 📐 Figma: 44:253 | 13-settings.html
 *
 * Features:
 * - 主題切換（深色/淺色/系統）
 * - AI 功能開關 (FR-036)
 * - 帳號資訊
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsClient } from './settings-client';

export const metadata = {
  title: '設定',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-['Noto_Sans_TC'] text-2xl font-bold text-[#e8f0f7]">設定</h1>
        <p className="text-sm font-normal text-[#8892a0]">管理您的帳號和偏好設定</p>
      </div>

      <SettingsClient user={session.user} />
    </div>
  );
}
