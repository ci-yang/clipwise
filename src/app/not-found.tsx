import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        {/* 404 Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
          <FileQuestion className="h-10 w-10 text-secondary" />
        </div>

        {/* 404 Text */}
        <h1 className="mb-2 font-heading text-6xl font-bold text-foreground">
          404
        </h1>
        <h2 className="mb-2 font-heading text-xl font-semibold text-foreground">
          找不到頁面
        </h2>
        <p className="mb-8 text-muted">
          您要找的頁面不存在，可能已被移除或網址有誤。
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              返回首頁
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bookmarks" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              我的書籤
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
