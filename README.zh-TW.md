<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Zeabur-已部署-00D4FF?style=for-the-badge" alt="Zeabur" />
</p>

<h1 align="center">Clipwise</h1>

<p align="center">
  <strong>AI 驅動的智慧書籤管理器</strong>
</p>

<p align="center">
  儲存任何網址，讓 AI 自動為你產生摘要和標籤。
</p>

<p align="center">
  <a href="https://clipwise.zeabur.app">線上展示</a> •
  <a href="#功能特色">功能特色</a> •
  <a href="#技術棧">技術棧</a> •
  <a href="#zeabur-整合">Zeabur 整合</a> •
  <a href="#快速開始">快速開始</a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## 概述

**Clipwise** 是一個現代化的書籤管理應用程式，利用 AI 自動分析、摘要和分類你儲存的連結。只需貼上網址，Clipwise 就會：

1. **擷取元資料** - 提取標題、描述和網站圖示
2. **產生 AI 摘要** - 建立 50-100 字的精簡摘要
3. **建議標籤** - 自動產生 2-5 個相關標籤
4. **智慧整理** - 篩選和搜尋你的書籤

為 [Zeabur "Ship It" Hackathon](https://memu.pro/hackathon/rules/zeabur)（2026 年 1 月 8-18 日）而建。

## 功能特色

### 核心功能
- **一鍵收藏** - 貼上網址即可儲存
- **AI 驅動摘要** - 自動內容分析和摘要產生
- **智慧標籤** - AI 產生的標籤，支援手動編輯
- **全文搜尋** - 跨標題、摘要和標籤搜尋
- **標籤篩選** - 快速按標籤篩選

### 使用者體驗
- **響應式設計** - 針對桌面、平板和手機優化
- **深色主題** - 精美的深色模式介面
- **即時更新** - AI 處理狀態即時輪詢
- **Google OAuth** - 安全的身份驗證

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Next.js 16（App Router） |
| 語言 | TypeScript 5 |
| 樣式 | Tailwind CSS 4 |
| 資料庫 | PostgreSQL（透過 Prisma ORM） |
| 身份驗證 | NextAuth.js 5（Google OAuth） |
| AI | Zeabur AI Hub（GPT-4.1-mini） |
| 部署 | Zeabur |
| 測試 | Vitest + Playwright |

## Zeabur 整合

Clipwise 專為 Zeabur 生態系統打造，同時使用 **AI Hub** 和**全端部署**功能。

### AI Hub 整合

Clipwise 使用 **Zeabur AI Hub** 進行智慧內容處理：

```typescript
// src/lib/ai.ts
const openai = new OpenAI({
  apiKey: process.env.ZEABUR_AI_API_KEY,
  baseURL: 'https://hnd1.aihub.zeabur.ai/v1', // 東京端點
});

// 使用 gpt-4.1-mini 實現快速、高性價比的處理
const AI_CONFIG = {
  model: 'gpt-4.1-mini',
  maxTokens: 500,
  temperature: 0.7,
};
```

**AI 功能：**
- **摘要產生** - 分析網頁內容並產生精簡摘要
- **標籤建議** - 提取關鍵主題並建議相關標籤
- **語言偵測** - 自動偵測並以內容的語言（中/英）回應
- **降級策略** - AI 處理失敗時優雅降級

### Zeabur 部署

作為容器化的 Next.js 應用程式部署，包含：

- **PostgreSQL 服務** - 託管資料庫，自動備份
- **環境變數** - 安全的密鑰管理
- **自訂網域** - `clipwise.zeabur.app`
- **自動擴展** - 自動處理流量高峰

```json
// zeabur.json
{
  "build": {
    "type": "nextjs"
  },
  "environment": {
    "DATABASE_URL": "@DATABASE_URL",
    "ZEABUR_AI_API_KEY": "@ZEABUR_AI_API_KEY"
  }
}
```

## 快速開始

### 先決條件

- Node.js 20+
- PostgreSQL 資料庫
- Google OAuth 憑證
- Zeabur AI API 金鑰

### 安裝

1. **複製儲存庫**
   ```bash
   git clone https://github.com/anthropics/clipwise.git
   cd clipwise
   ```

2. **安裝依賴**
   ```bash
   pnpm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   ```

   編輯 `.env` 填入你的憑證：
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/clipwise
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ZEABUR_AI_API_KEY=your-zeabur-ai-key
   ```

4. **初始化資料庫**
   ```bash
   pnpm db:push
   ```

5. **啟動開發伺服器**
   ```bash
   pnpm dev
   ```

   開啟 [http://localhost:3000](http://localhost:3000)

### 指令

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 啟動開發伺服器 |
| `pnpm build` | 建置生產版本 |
| `pnpm start` | 啟動生產伺服器 |
| `pnpm lint` | 執行 ESLint |
| `pnpm test` | 執行單元測試 |
| `pnpm test:e2e` | 執行 E2E 測試 |
| `pnpm db:studio` | 開啟 Prisma Studio |

## 專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 身份驗證頁面（登入、回呼）
│   ├── (dashboard)/       # 主應用程式頁面
│   │   ├── bookmarks/     # 書籤列表
│   │   ├── search/        # 搜尋頁面
│   │   ├── tags/          # 標籤管理
│   │   └── settings/      # 使用者設定
│   └── api/               # API 路由
├── components/            # React 元件
├── hooks/                 # 自訂 React Hooks
├── lib/                   # 工具和設定
└── services/              # 業務邏輯服務
```

## 截圖

### 桌面版
<p align="center">
  <em>書籤列表，包含 AI 產生的摘要和標籤</em>
</p>

### 手機版
<p align="center">
  <em>響應式設計，底部導航</em>
</p>

## 授權

MIT 授權 - 詳見 [LICENSE](LICENSE)。

---

<p align="center">
  為 <a href="https://memu.pro/hackathon/rules/zeabur">Zeabur "Ship It" Hackathon</a> 用 ❤️ 打造
</p>
