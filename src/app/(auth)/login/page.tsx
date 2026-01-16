import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginButton } from '@/components/auth/login-button';

export const metadata: Metadata = {
  title: '登入',
  description: '登入 Clipwise，開始管理您的智慧書籤',
};

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, redirect to bookmarks
  if (session?.user) {
    redirect('/bookmarks');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="relative mx-auto w-full max-w-[448px]">
        {/* Logo */}
        <div className="mb-16 text-center">
          <Link href="/" className="inline-block">
            <span className="font-sans text-2xl font-bold text-[#00d4ff]">Clipwise</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#234567] bg-[rgba(19,35,55,0.95)] p-8 backdrop-blur-[10px]">
          {/* Header */}
          <div className="mb-8 space-y-2 text-center">
            <h1 className="font-heading text-2xl font-bold text-[#e8f0f7]">歡迎使用 Clipwise</h1>
            <p className="text-base font-light text-[#8892a0]">登入以同步你的書籤</p>
          </div>

          {/* Google Login Button */}
          <LoginButton />

          {/* Terms */}
          <p className="mt-6 text-center text-xs font-light text-[#8892a0]">
            登入即表示你同意我們的{' '}
            <Link href="/terms" className="text-[#00d4ff] hover:underline">
              服務條款
            </Link>{' '}
            與{' '}
            <Link href="/privacy" className="text-[#00d4ff] hover:underline">
              隱私政策
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-sm font-light text-[#8892a0] transition-colors hover:text-[#00d4ff]"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
