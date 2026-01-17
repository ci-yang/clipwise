/**
 * Settings Client Component - 設定頁面客戶端元件
 * 📐 Figma: 44:253 | 13-settings.html
 *
 * Design sections:
 * 1. 個人資料 - 頭像、姓名、email
 * 2. 外觀設定 - 深色模式、跟隨系統
 * 3. AI 設定 - 自動摘要、自動標籤
 * 4. 帳號 - 登出按鈕
 */

'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import type { User } from 'next-auth';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface SettingsClientProps {
  user: User;
}

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-xl transition-colors ${
        checked ? 'bg-[#00d4ff]' : 'bg-[#234567]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-[10px] bg-white transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [autoSummary, setAutoSummary] = useState(true);
  const [autoTags, setAutoTags] = useState(true);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* 個人資料 Section - Figma: 44:286 */}
      <section className="rounded-xl border border-[#234567] bg-[rgba(19,35,55,0.85)] p-6 backdrop-blur-[10px]">
        <h2 className="mb-4 text-lg font-bold text-[#e8f0f7]">個人資料</h2>

        <div className="flex items-center gap-6">
          {/* Avatar - Figma: 44:290 */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-medium text-white"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(19, 78, 74, 1) 100%)',
            }}
          >
            {user.name?.charAt(0) || 'U'}
          </div>

          {/* User Info - Figma: 44:292 */}
          <div className="flex flex-col">
            <p className="text-lg font-medium text-[#e8f0f7]">{user.name}</p>
            <p className="text-sm font-light text-[#8892a0]">{user.email}</p>
            <p className="mt-1 text-xs text-[#8892a0]">透過 Google 登入</p>
          </div>
        </div>
      </section>

      {/* 外觀設定 Section - Figma: 44:299 */}
      <section className="rounded-xl border border-[#234567] bg-[rgba(19,35,55,0.85)] p-6 backdrop-blur-[10px]">
        <h2 className="mb-4 text-lg font-bold text-[#e8f0f7]">外觀設定</h2>
        <ThemeToggle />
      </section>

      {/* AI 設定 Section - Figma: 44:319 */}
      <section className="rounded-xl border border-[#234567] bg-[rgba(19,35,55,0.85)] p-6 backdrop-blur-[10px]">
        <h2 className="mb-4 text-lg font-bold text-[#e8f0f7]">AI 設定</h2>

        <div className="flex flex-col gap-4">
          {/* 自動生成摘要 - Figma: 44:323 */}
          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col">
              <span className="text-base font-medium text-[#e8f0f7]">自動生成摘要</span>
              <span className="text-sm font-light text-[#8892a0]">
                新增書籤時自動生成 AI 摘要
              </span>
            </div>
            <ToggleSwitch checked={autoSummary} onChange={setAutoSummary} />
          </div>

          {/* 自動生成標籤 - Figma: 44:331 */}
          <div className="flex items-center justify-between border-t border-[#234567] py-3">
            <div className="flex flex-col">
              <span className="text-base font-medium text-[#e8f0f7]">自動生成標籤</span>
              <span className="text-sm font-light text-[#8892a0]">
                AI 根據內容自動建議標籤
              </span>
            </div>
            <ToggleSwitch checked={autoTags} onChange={setAutoTags} />
          </div>
        </div>
      </section>

      {/* 帳號 Section - Figma: 44:339 */}
      <section className="rounded-xl border border-[#234567] bg-[rgba(19,35,55,0.85)] p-6 backdrop-blur-[10px]">
        <h2 className="mb-4 text-lg font-bold text-[#e8f0f7]">帳號</h2>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-medium text-[#e8f0f7]">登出</span>
            <span className="text-sm font-light text-[#8892a0]">登出目前的帳號</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-xl border border-[#234567] px-4 py-2 text-base font-light text-[#8892a0] transition-colors hover:border-[#8892a0] hover:text-[#e8f0f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOut ? '登出中...' : '登出'}
          </button>
        </div>
      </section>
    </div>
  );
}
