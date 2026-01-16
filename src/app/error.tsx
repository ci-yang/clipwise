'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>

        {/* Error Message */}
        <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">
          發生錯誤
        </h1>
        <p className="mb-6 text-muted">
          很抱歉，系統發生了一些問題。請稍後再試或重新整理頁面。
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg border border-border bg-background-alt p-4 text-left">
            <p className="mb-2 text-sm font-medium text-danger">
              {error.name}: {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="inline-flex items-center gap-2"
            variant="default"
          >
            <RefreshCw className="h-4 w-4" />
            重試
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
