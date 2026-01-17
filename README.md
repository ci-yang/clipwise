<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Zeabur-Deployed-00D4FF?style=for-the-badge" alt="Zeabur" />
</p>

<h1 align="center">Clipwise</h1>

<p align="center">
  <strong>AI-Powered Smart Bookmark Manager</strong>
</p>

<p align="center">
  Save any URL and let AI automatically generate summaries and tags for you.
</p>

<p align="center">
  <a href="https://clipwise.zeabur.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#zeabur-integration">Zeabur Integration</a> •
  <a href="#getting-started">Getting Started</a>
</p>

<p align="center">
  <a href="./README.zh-TW.md">繁體中文</a>
</p>

---

## Overview

**Clipwise** is a modern bookmark management application that leverages AI to automatically analyze, summarize, and categorize your saved links. Simply paste a URL, and Clipwise will:

1. **Fetch metadata** - Extract title, description, and favicon
2. **Generate AI summary** - Create a concise 50-100 word summary
3. **Suggest tags** - Automatically generate 2-5 relevant tags
4. **Organize intelligently** - Filter and search across your bookmarks

Built for the [Zeabur "Ship It" Hackathon](https://memu.pro/hackathon/rules/zeabur) (Jan 8-18, 2026).

## Features

### Core Features
- **One-Click Bookmarking** - Paste URL and save instantly
- **AI-Powered Summaries** - Automatic content analysis and summarization
- **Smart Tagging** - AI-generated tags with manual editing support
- **Full-Text Search** - Search across titles, summaries, and tags
- **Tag Filtering** - Quick filter by tags

### User Experience
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Dark Theme** - Beautiful dark mode interface
- **Real-time Updates** - Live AI processing status with polling
- **Google OAuth** - Secure authentication

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (via Prisma ORM) |
| Authentication | NextAuth.js 5 (Google OAuth) |
| AI | Zeabur AI Hub (GPT-4.1-mini) |
| Deployment | Zeabur |
| Testing | Vitest + Playwright |

## Zeabur Integration

Clipwise is built specifically for Zeabur's ecosystem, utilizing both **AI Hub** and **Full-Stack Deployment** capabilities.

### AI Hub Integration

Clipwise uses **Zeabur AI Hub** for intelligent content processing:

```typescript
// src/lib/ai.ts
const openai = new OpenAI({
  apiKey: process.env.ZEABUR_AI_API_KEY,
  baseURL: 'https://hnd1.aihub.zeabur.ai/v1', // Tokyo endpoint
});

// Using gpt-4.1-mini for fast, cost-effective processing
const AI_CONFIG = {
  model: 'gpt-4.1-mini',
  maxTokens: 500,
  temperature: 0.7,
};
```

**AI Features:**
- **Summary Generation** - Analyzes webpage content and generates concise summaries
- **Tag Suggestion** - Extracts key topics and suggests relevant tags
- **Language Detection** - Automatically detects and responds in the content's language (zh/en)
- **Fallback Strategy** - Graceful degradation when AI processing fails

### Zeabur Deployment

Deployed as a containerized Next.js application with:

- **PostgreSQL Service** - Managed database with automatic backups
- **Environment Variables** - Secure secrets management
- **Custom Domain** - `clipwise.zeabur.app`
- **Auto-scaling** - Handles traffic spikes automatically

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

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials
- Zeabur AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anthropics/clipwise.git
   cd clipwise
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/clipwise
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ZEABUR_AI_API_KEY=your-zeabur-ai-key
   ```

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, callback)
│   ├── (dashboard)/       # Main app pages
│   │   ├── bookmarks/     # Bookmark list
│   │   ├── search/        # Search page
│   │   ├── tags/          # Tag management
│   │   └── settings/      # User settings
│   └── api/               # API routes
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
└── services/              # Business logic services
```

## Screenshots

### Desktop View
<p align="center">
  <em>Bookmark list with AI-generated summaries and tags</em>
</p>

### Mobile View
<p align="center">
  <em>Responsive design with bottom navigation</em>
</p>

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for the <a href="https://memu.pro/hackathon/rules/zeabur">Zeabur "Ship It" Hackathon</a>
</p>
