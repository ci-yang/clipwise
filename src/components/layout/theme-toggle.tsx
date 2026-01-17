/**
 * T100: ThemeToggle - 主題切換元件
 * 📐 Figma: 44:253 | 13-settings.html
 *
 * Features:
 * - Toggle between dark/light/system themes
 * - Switch UI matching Figma design
 * - Hydration-safe implementation
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ThemeSwitch({ checked, onChange, disabled }: ThemeSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-xl transition-colors',
        checked ? 'bg-[#00d4ff]' : 'bg-[#234567]',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-[10px] bg-white transition-all',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        {/* Dark mode setting skeleton */}
        <div className="flex items-center justify-between py-3">
          <div className="flex flex-col gap-1">
            <div className="h-6 w-20 animate-pulse rounded bg-[#234567]" />
            <div className="h-5 w-32 animate-pulse rounded bg-[#234567]" />
          </div>
          <div className="h-6 w-11 animate-pulse rounded-xl bg-[#234567]" />
        </div>
        {/* System setting skeleton */}
        <div className="flex items-center justify-between border-t border-[#234567] py-3">
          <div className="flex flex-col gap-1">
            <div className="h-6 w-24 animate-pulse rounded bg-[#234567]" />
            <div className="h-5 w-40 animate-pulse rounded bg-[#234567]" />
          </div>
          <div className="h-6 w-11 animate-pulse rounded-xl bg-[#234567]" />
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const isSystem = theme === 'system';

  const handleDarkModeToggle = (checked: boolean) => {
    if (isSystem) {
      // If system mode is enabled, toggle off system first
      setTheme(checked ? 'dark' : 'light');
    } else {
      setTheme(checked ? 'dark' : 'light');
    }
  };

  const handleSystemToggle = (checked: boolean) => {
    if (checked) {
      setTheme('system');
    } else {
      // When turning off system, use current resolved theme
      setTheme(resolvedTheme || 'dark');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between py-3">
        <div className="flex flex-col">
          <span className="text-base font-medium text-[#e8f0f7]">深色模式</span>
          <span className="text-sm font-light text-[#8892a0]">啟用深色介面主題</span>
        </div>
        <ThemeSwitch
          checked={isDark}
          onChange={handleDarkModeToggle}
          disabled={isSystem}
        />
      </div>

      {/* System Theme Toggle */}
      <div className="flex items-center justify-between border-t border-[#234567] py-3">
        <div className="flex flex-col">
          <span className="text-base font-medium text-[#e8f0f7]">跟隨系統設定</span>
          <span className="text-sm font-light text-[#8892a0]">
            自動切換深色 / 淺色模式
          </span>
        </div>
        <ThemeSwitch checked={isSystem} onChange={handleSystemToggle} />
      </div>
    </div>
  );
}
