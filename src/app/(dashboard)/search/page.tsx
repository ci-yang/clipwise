/**
 * Search Page - 搜尋頁面
 * 📐 Figma: 29:383 | 10-search-results.html
 *
 * 重定向到書籤頁面並聚焦搜尋框
 * 搜尋功能整合在 /bookmarks 頁面的 header 中
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: '搜尋',
};

export default function SearchPage() {
  // 搜尋功能在 /bookmarks 頁面，這裡重定向過去
  redirect('/bookmarks?focus=search');
}
