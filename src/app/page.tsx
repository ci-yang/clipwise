import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Bookmark, Sparkles, Tag, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const session = await auth()

  // If logged in, redirect to bookmarks
  if (session?.user) {
    redirect('/bookmarks')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text font-heading text-xl font-bold text-transparent">
              Clipwise
            </span>
          </Link>
          <Button asChild>
            <Link href="/login">登入</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mb-6 font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            AI 智慧書籤管理
            <br />
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              讓收藏更有價值
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted md:text-xl">
            貼上連結，AI
            自動產生摘要與標籤。不再遺忘任何有價值的內容，隨時找到你需要的資訊。
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">免費開始使用</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="#features">了解更多</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border bg-background-alt py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center font-heading text-3xl font-bold text-foreground">
              強大功能，簡單易用
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Feature 1 */}
              <div className="rounded-xl border border-border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <Bookmark className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  一鍵保存
                </h3>
                <p className="text-sm text-muted">
                  貼上網址即可保存，自動抓取標題和縮圖
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  AI 摘要
                </h3>
                <p className="text-sm text-muted">
                  智慧分析內容，自動產生精簡摘要
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <Tag className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  智慧標籤
                </h3>
                <p className="text-sm text-muted">
                  AI 自動分類，輕鬆管理書籤
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <Search className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  全文搜尋
                </h3>
                <p className="text-sm text-muted">
                  快速找到任何書籤，支援標題和內容搜尋
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground">
              準備好開始了嗎？
            </h2>
            <p className="mb-8 text-lg text-muted">
              免費註冊，立即體驗 AI 智慧書籤管理
            </p>
            <Button asChild size="lg">
              <Link href="/login">免費開始使用</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted">
          <p>&copy; 2026 Clipwise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
