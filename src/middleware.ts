import { auth } from '@/lib/auth'

export default auth

export const config = {
  matcher: [
    '/bookmarks/:path*',
    '/settings/:path*',
  ],
}
