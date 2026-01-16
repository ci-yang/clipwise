import type { Metadata } from 'next';
import { Space_Grotesk as SpaceGrotesk, Inter, Noto_Sans_TC as NotoSansTC } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const spaceGrotesk = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansTC = NotoSansTC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Clipwise - AI 智慧書籤管理平台',
    template: '%s | Clipwise',
  },
  description: '貼上連結，AI 自動產生摘要與標籤。讓書籤管理更智慧、更有效率。',
  keywords: ['書籤', '書籤管理', 'AI', '摘要', '標籤', 'bookmark'],
  authors: [{ name: 'Clipwise Team' }],
  openGraph: {
    title: 'Clipwise - AI 智慧書籤管理平台',
    description: '貼上連結，AI 自動產生摘要與標籤。讓書籤管理更智慧、更有效率。',
    type: 'website',
    locale: 'zh_TW',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${notoSansTC.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
