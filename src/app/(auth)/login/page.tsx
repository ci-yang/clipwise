import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginButton } from '@/components/auth/login-button'

export const metadata: Metadata = {
  title: '登入',
  description: '登入 Clipwise，開始管理您的智慧書籤',
}

export default async function LoginPage() {
  const session = await auth()

  // If already logged in, redirect to bookmarks
  if (session?.user) {
    redirect('/bookmarks')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            <h1 className="bg-gradient-to-r from-secondary to-accent bg-clip-text font-heading text-3xl font-bold text-transparent">
              Clipwise
            </h1>
          </Link>
          <p className="mt-2 text-muted">AI 智慧書籤管理平台</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-background-alt p-8">
          <h2 className="mb-2 text-center font-heading text-xl font-semibold text-foreground">
            歡迎回來
          </h2>
          <p className="mb-6 text-center text-sm text-muted">
            使用 Google 帳號登入，即可開始使用
          </p>

          {/* Google Login Button */}
          <LoginButton />

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted">
            登入即表示您同意我們的
            <Link href="/terms" className="text-secondary hover:underline">
              服務條款
            </Link>
            和
            <Link href="/privacy" className="text-secondary hover:underline">
              隱私政策
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center text-sm text-muted">
          還沒準備好？
          <Link href="/" className="text-secondary hover:underline">
            返回首頁
          </Link>
        </p>
      </div>
    </div>
  )
}
