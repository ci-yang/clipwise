/**
 * Settings Client Component - 設定頁面客戶端元件
 * 📐 Figma: 44:253 | 13-settings.html
 *
 * Features:
 * - 帳號資訊顯示
 * - AI 功能開關 (FR-036) - 預留
 * - 登出功能
 */

'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import type { User } from 'next-auth';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';

interface SettingsClientProps {
  user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="space-y-6">
      {/* Account Section */}
      <section className="rounded-2xl border border-[#234567] bg-[#132337] p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-[#00d4ff]" />
          <h2 className="text-lg font-medium text-[#e8f0f7]">帳號資訊</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-medium text-white"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, rgba(0, 212, 255, 1) 0%, rgba(19, 78, 74, 1) 100%)',
              }}
            >
              {user.name?.charAt(0) || 'U'}
            </div>

            <div>
              <p className="text-lg font-medium text-[#e8f0f7]">{user.name}</p>
              <p className="text-sm text-[#8892a0]">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-[#234567] pt-4">
            <p className="text-sm text-[#8892a0]">透過 Google 帳號登入</p>
          </div>
        </div>
      </section>

      {/* AI Settings Section */}
      <section className="rounded-2xl border border-[#234567] bg-[#132337] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#00d4ff]" />
          <h2 className="text-lg font-medium text-[#e8f0f7]">AI 功能</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#e8f0f7]">自動產生摘要與標籤</p>
              <p className="text-sm text-[#8892a0]">
                新增書籤時，AI 將自動分析內容並產生摘要與標籤
              </p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                aiEnabled ? 'bg-[#00d4ff]' : 'bg-[#234567]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  aiEnabled ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="rounded-xl bg-[rgba(0,212,255,0.1)] p-4">
            <p className="text-sm text-[#00d4ff]">
              💡 AI 配額：每日 20 次自動處理（黑客松限定）
            </p>
          </div>
        </div>
      </section>

      {/* Sign Out Section */}
      <section className="rounded-2xl border border-[#234567] bg-[#132337] p-6">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {isSigningOut ? '登出中...' : '登出帳號'}
        </button>
      </section>
    </div>
  );
}
