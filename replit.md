# Akiro Labs DeFi Terminal

## Overview

Akiro Labs is a professional DeFi trading terminal with a chat-based AI assistant interface. It's built as a full-stack web application that lets users interact with live cryptocurrency price data from the Pyth Network via natural language conversation. Key features include:

- **AI Chat Terminal**: Users chat with "Akiro AI" (powered by Google Gemini) to get market analysis, price checks, and trading insights
- **SSE Live Price Feeds**: Real-time prices via Server-Sent Events (2.5s stream) for Crypto (9), Stocks (AAPL/TSLA/NVDA/MSFT), FX (EUR/USD, GBP/USD), Metals (Gold)
- **Pyth Benchmarks**: Historical prices at specific timestamps via benchmarks.pyth.network API
- **Real Jupiter Swaps**: AI detects swap intent → PrepareSwapCard fetches Jupiter quote from browser → user signs with Phantom → tx sent to Solana mainnet
- **Price Alerts**: Set via natural language; alerts track conditions and trigger email notifications via Resend
- **Phantom Wallet Integration**: Connect Solana wallets; public key passed to AI context and swap transactions

The UI is styled as a dark terminal interface with a three-panel layout (left sidebar for alerts/wallet, center chat, right sidebar for live prices).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: React `useState`/`useCallback`/`useEffect` hooks with TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming; dark terminal theme with `oklch` colors
- **Fonts**: Inter (UI), JetBrains Mono (code/data), Orbitron (logo)
- **Animations**: Framer Motion (`motion/react`)
- **Additional UI**: MUI (Material UI) also installed alongside shadcn

**Directory structure note**: There are two parallel frontend structures:
- `src/app/` — the active application (App.tsx, components/, services/, utils/)
- `client/src/` — appears to be a duplicate/alternative structure
- `src/components/ui/` — shadcn UI primitives shared across both

The active entry point is `src/main.tsx` → `src/app/App.tsx`.

**Three-panel layout**:
- `LeftSidebar`: Wallet connection status + price alerts panel
- `ChatTerminal`: Main AI chat interface with message cards for rich data display
- `RightSidebar`: Live Pyth price feed ticker (polls every 10 seconds)

### Backend Architecture

- **Runtime**: Node.js with Express (TypeScript via `tsx`)
- **Server entry**: `server/index.ts`
- **Dev server**: Vite dev server integrated via `server/vite.ts` middleware for HMR in development; static file serving in production via `server/static.ts`

**Key server modules**:
- `server/routes.ts` — all API route definitions
- `server/pythService.ts` — fetches and caches Pyth Network prices (5-second TTL cache)
- `server/geminiService.ts` — wraps Google Gemini API, includes system prompt with DeFi context and alert intent detection
- `server/alertStore.ts` — in-memory alert store (Map-based, not persisted to DB)

**API Endpoints**:
- `GET /api/health` — service status check
- `GET /api/pyth/prices?symbols=BTC,ETH,...` — bulk price fetch
- `GET /api/pyth/price/:symbol` — single symbol price
- `POST /api/chat` — send chat message, returns AI response + optional alert action
- `GET /api/alerts` — list all alerts
- `POST /api/alerts` — create alert
- `DELETE /api/alerts/:id` — delete alert
- Alert price checking happens server-side on a polling interval

### Data Storage

- **Database**: PostgreSQL via Drizzle ORM (configured in `drizzle.config.ts`)
- **Schema** (`shared/schema.ts`): `users` table (id, username, password)
- **Chat schema** (`shared/models/chat.ts`): `conversations` and `messages` tables — used by the Replit chat integration module
- **Alert storage**: Currently **in-memory only** via `server/alertStore.ts` (not persisted to DB) — alerts reset on server restart
- **User storage**: Also in-memory via `server/storage.ts` (`MemStorage`) — DB schema exists but the main app uses the memory store

The Replit chat integration (`server/replit_integrations/chat/`) uses the DB via Drizzle for conversation persistence, but the main app's chat goes directly through `server/geminiService.ts` without DB persistence.

### Authentication

- Basic user schema exists (username + password in DB) but no active auth middleware is wired in the main routes — the app is currently unauthenticated
- Wallet connection uses Phantom browser extension (`window.solana`) — no backend auth for wallet

### Trading Tools (Client-Side)

`src/app/utils/tradingTools.ts` contains client-side utility classes:
- `VolatilityEngine` — calculates volatility metrics from Pyth confidence data
- `ConfidenceAnalyzer` — analyzes Pyth oracle confidence intervals
- `CrossAssetCorrelator` — correlation analysis between assets
- `SmartSwapEngine` — Jupiter DEX swap route estimation
- `LimitOrderManager` — limit order tracking
- `RiskManager` — portfolio risk scoring

These fetch directly from the Pyth Hermes API client-side as well, in addition to the server-side proxy.

### Replit Integration Modules

`server/replit_integrations/` contains plug-and-play modules:
- `chat/` — full conversation management with DB persistence using Gemini
- `image/` — image generation via `gemini-2.5-flash-image`
- `batch/` — rate-limited batch processing with retry logic

These use `AI_INTEGRATIONS_GEMINI_API_KEY` and `AI_INTEGRATIONS_GEMINI_BASE_URL` env vars (Replit's hosted Gemini proxy). The main app's `geminiService.ts` now also uses `@google/genai` SDK with the same integration env vars (prioritizes `AI_INTEGRATIONS_GEMINI_BASE_URL` over a direct `GEMINI_API_KEY`).

## External Dependencies

### APIs & Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Pyth Network Hermes** | Real-time crypto price oracles | `https://hermes.pyth.network/v2/...` — no auth required |
| **Google Gemini** | AI chat assistant (Akiro AI) | `GEMINI_API_KEY` env var; also supports `AI_INTEGRATIONS_GEMINI_BASE_URL` + `AI_INTEGRATIONS_GEMINI_API_KEY` for Replit's proxy |
| **Resend** | Email notifications for triggered price alerts | `RESEND_API_KEY` env var |
| **Phantom Wallet** | Solana wallet connection via browser extension | `window.solana` browser API — no backend key needed |
| **Jupiter DEX** | Swap routing on Solana (described in AI responses, not directly integrated yet) | No API key currently |

### Database

- **PostgreSQL**: Required via `DATABASE_URL` env var
- **Drizzle ORM**: Schema in `shared/schema.ts` and `shared/models/chat.ts`
- Run migrations with: `drizzle-kit push` or `drizzle-kit migrate`

### Required Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
GEMINI_API_KEY        # Google Gemini API key for main chat
RESEND_API_KEY        # Resend email service for alert notifications
# Optional (Replit AI Integrations):
AI_INTEGRATIONS_GEMINI_API_KEY
AI_INTEGRATIONS_GEMINI_BASE_URL
```

### Key npm Packages

- `@google/genai` — Gemini SDK
- `drizzle-orm` + `pg` — Database ORM + PostgreSQL driver
- `resend` — Email service client
- `@tanstack/react-query` — Server state management
- `wouter` — Client-side routing
- `motion/react` (Framer Motion) — UI animations
- `lucide-react` — Icons
- `@radix-ui/*` — Accessible UI primitives
- `class-variance-authority` + `clsx` + `tailwind-merge` — Tailwind utility helpers