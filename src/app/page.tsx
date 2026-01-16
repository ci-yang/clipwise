import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  // If logged in, redirect to bookmarks
  if (session?.user) {
    redirect('/bookmarks');
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(35,69,103,0.5)] bg-[rgba(10,22,40,0.8)] backdrop-blur-[6px]">
        <div className="mx-auto flex h-[60px] max-w-[1152px] items-center justify-center px-6">
          <Link href="/">
            <span className="text-xl font-bold text-[#00d4ff]">Clipwise</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="mx-auto max-w-[896px] px-6 pt-32 pb-20 text-center">
          {/* Badge */}
          <div className="mb-10 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.1)] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff]" />
              <span className="text-sm font-light text-[#00d4ff]">AI 驅動的書籤管理</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-5xl leading-tight font-bold text-[#e8f0f7] md:text-6xl">
            零整理成本的
            <br />
            <span className="text-[#00d4ff]">智慧書籤</span>管理
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed font-light text-[#8892a0] md:text-xl">
            貼上連結，AI 自動產生摘要和標籤。
            <br />
            隨時搜尋，隨時找回你收藏的每一個網頁。
          </p>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-block rounded-xl bg-[#00d4ff] px-8 py-4 text-lg font-bold text-[#0a1628] transition-colors hover:bg-[#00b8d9]"
          >
            免費開始使用
          </Link>

          {/* Feature Preview Card */}
          <div className="mx-auto mt-20 max-w-[672px] overflow-hidden rounded-2xl border border-[#234567] bg-[rgba(19,35,55,0.8)] shadow-[0px_25px_50px_-12px_rgba(0,212,255,0.05)] backdrop-blur-[6px]">
            {/* Input Preview */}
            <div className="flex items-center gap-4 border-b border-[#234567] px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(0,212,255,0.2)]">
                <svg
                  className="h-5 w-5 text-[#00d4ff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <span className="text-base font-light text-[#e8f0f7]">貼上連結，開始收藏...</span>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-6 px-6 py-6">
              {/* AI Summary */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(168,85,247,0.2)]">
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-sm font-medium text-[#e8f0f7]">AI 摘要</p>
                <p className="mt-1 text-xs font-light text-[#8892a0]">自動產生重點摘要</p>
              </div>

              {/* Smart Tags */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.2)]">
                  <span className="text-2xl">🏷️</span>
                </div>
                <p className="text-sm font-medium text-[#e8f0f7]">智慧標籤</p>
                <p className="mt-1 text-xs font-light text-[#8892a0]">AI 自動分類標籤</p>
              </div>

              {/* Full-text Search */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.2)]">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-sm font-medium text-[#e8f0f7]">全文搜尋</p>
                <p className="mt-1 text-xs font-light text-[#8892a0]">快速找到任何書籤</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[rgba(35,69,103,0.5)] py-20">
          <div className="mx-auto max-w-[1152px] px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <h2 className="font-heading mb-4 text-4xl font-bold text-[#e8f0f7]">
                為什麼選擇 Clipwise？
              </h2>
              <p className="text-lg font-light text-[#8892a0]">告別混亂的書籤列表，擁抱智慧整理</p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-[#234567] bg-[#132337] p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(0,212,255,0.2)]">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#e8f0f7]">一鍵保存</h3>
                <p className="leading-relaxed font-light text-[#8892a0]">
                  只需貼上連結，系統自動抓取標題、縮圖和內容。無需手動整理。
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-[#234567] bg-[#132337] p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(168,85,247,0.2)]">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#e8f0f7]">AI 自動整理</h3>
                <p className="leading-relaxed font-light text-[#8892a0]">
                  AI 自動產生摘要和標籤，讓你的書籤井然有序，無需人工分類。
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-[#234567] bg-[#132337] p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.2)]">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#e8f0f7]">快速搜尋</h3>
                <p className="leading-relaxed font-light text-[#8892a0]">
                  全文搜尋功能讓你在毫秒之間找到任何書籤，支援標題、摘要和標籤。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(35,69,103,0.5)] py-12">
        <div className="mx-auto flex max-w-[1152px] items-center justify-between px-6">
          <span className="text-xl font-bold text-[#00d4ff]">Clipwise</span>
          <span className="text-sm text-[#8892a0]">© 2026 Clipwise. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
