# 📊 Telemetr — Telegram Activity Intelligence Platform

> Production-quality Telegram Activity Analytics platform engineered with **TypeScript**, **Next.js 15 (App Router)**, **PostgreSQL (Supabase)**, **Drizzle ORM**, **Grammy**, and an isolated **MTProto Tracking Engine** (GramJS).

![Telemetr Banner](https://img.shields.io/badge/Telemetr-Telegram%20Analytics-blue?style=for-the-badge&logo=telegram)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-PostgreSQL-green?style=flat)](https://orm.drizzle.team/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=flat&logo=supabase)](https://supabase.com/)
[![Grammy](https://img.shields.io/badge/Grammy-Telegram%20Bot-blue?style=flat&logo=telegram)](https://grammy.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Highlights & Philosophy

Telemetr answers questions like:
- *How active was this Telegram account today and over the last 7/30 days?*
- *What was the busiest hour (peak hour) and quiet window?*
- *What are the account's historical presence trends (+% / -%)?*
- *How long was the longest continuous activity session?*
- *How has activity evolved since observation began?*

### ⚖️ Honest Data Semantics & Ethics
1. **No retroactive claims**: Data collection strictly begins from the moment tracking is activated.
2. **Observable Presence != Device Screen Time**: Telemetr transparently distinguishes between observable Telegram online signals and total device usage.
3. **Privacy First**: Zero access to private conversations, messages, contacts, or passwords.

---

## 🏛️ Architecture Overview

```
                         ┌──────────────────────┐
                         │       Telegram       │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴───────────────┐
                     │                              │
                     ▼                              ▼
              Telegram Bot API                MTProto Engine
                     │                              │
                     ▼                              ▼
                Next.js App                    Tracker Worker
                     │                              │
                     ├──────────────┬───────────────┤
                     │              │
                     ▼              ▼
           Supabase (PostgreSQL)  State Engine
                     │              │
                     └──────┬───────┘
                            ▼
                     Analytics Engine
                            │
               ┌────────────┼─────────────┐
               ▼            ▼             ▼
            Daily         Weekly       Monthly
            Reports       Trends       Heatmaps
               │            │             │
               └────────────┼─────────────┘
                            ▼
                    Telegram Mini App
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- `pnpm` (`v9+` or `v10+`)
- PostgreSQL (or Supabase instance)
- Telegram Bot API token from [@BotFather](https://t.me/BotFather)

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your variables:
```env
# Supabase / PostgreSQL Connection
DATABASE_URL="postgresql://postgres.hqmwbkxwzdccikoraono:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hqmwbkxwzdccikoraono:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Telegram Bot Token
TELEGRAM_BOT_TOKEN="your_bot_token"

# MTProto Credentials (optional for mock, required for live MTProto)
TELEGRAM_API_ID=""
TELEGRAM_API_HASH=""

# Security Keys
SESSION_ENCRYPTION_KEY="your-32-byte-secret-encryption-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TELEGRAM_WEBHOOK_SECRET="your_webhook_secret"
```

### 3. Database Migration
Run Drizzle schema migration on Supabase:
```bash
pnpm db:migrate
```

### 4. Running the Application
```bash
# Run Next.js Web App & Telegram Mini App
pnpm dev

# Run Standalone MTProto Tracker Worker
pnpm worker

# Run Telegram Bot in Long-Polling Mode (Local Dev)
pnpm bot:poll
```

---

## 🧪 Testing

Run the automated Vitest test suite:
```bash
pnpm test
```

Test coverage includes:
- ✅ Session State Machine transitions & duration calculations
- ✅ Midnight boundary splitting (e.g. 23:50 -> 00:20 across calendar days)
- ✅ Telegram Mini App `initData` HMAC-SHA256 signature verification & forgery rejection
- ✅ Trend percentage comparisons, rolling averages, streaks & quiet hour detection

---

## 📱 Features

- **Telegram Mini App**: Touch-optimized, mobile-first dashboard syncing with Telegram theme variables (`--tg-theme-bg-color`, `--tg-theme-text-color`).
- **Activity Calendar**: GitHub-style activity intensity calendar.
- **24-Hour Heatmap**: Visual distribution of presence by hour of the day.
- **Account Comparison**: Side-by-side metric comparison between multiple accounts.
- **Data Export**: Verified CSV and JSON data export.
- **Smart Bot UX**: Interactive inline keyboards with smooth in-place message editing.

---

## 📄 License
MIT License. Created for high-performance Telegram Activity Intelligence.
