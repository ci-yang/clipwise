import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default async function CallbackPage() {
  const session = await auth();

  // If authenticated, redirect to bookmarks
  if (session?.user) {
    redirect('/bookmarks');
  }

  // If not authenticated, redirect to login
  redirect('/login');
}

// Loading state while processing OAuth callback
export function Loading() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <Loader2 className="text-secondary mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted mt-4">正在處理登入...</p>
      </div>
    </div>
  );
}
