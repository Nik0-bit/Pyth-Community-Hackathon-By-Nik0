# By Nik0 — DeFi Terminal

**Full-stack trading terminal** with live oracles, AI chat, and analytics. Built for the Pyth hackathon.

---

## What it is

**By Nik0** is a single-page terminal that gives traders and developers:

- **Live prices** — crypto, stocks, FX, metals via **Pyth Network** oracles
- **Charts & technical analysis** — candlesticks, timeframes (1m–1W), overlays (RSI, MACD, MA, Bollinger)
- **AI assistant** — natural-language questions about prices, volatility, alerts; powered by Gemini, fed with **Pyth** context
- **Price alerts** — set by chat or UI; email notifications when conditions hit
- **Swap context** — Jupiter quotes and route info (Solana); no on-chain signing from the app

All price and history data that drives the UI and the AI comes from **Pyth** where available; charts use Binance OHLC as a complement for crypto.

---

## Why Pyth

The app is built **on top of Pyth** as the primary data layer:

| Use case | Pyth source | How it’s used |
|----------|-------------|----------------|
| **Real-time prices** | [Pyth Hermes API](https://hermes.pyth.network) — `GET /v2/updates/price/latest?ids[]=<price_id>` | Server fetches latest prices by Pyth price IDs; cached and exposed via `/api/pyth/prices` and SSE stream. Powers tickers, chat context, and alert checks. |
| **Historical prices** | [Pyth Benchmarks API](https://benchmarks.pyth.network) — `GET /v1/updates/price/{timestamp}?ids=<price_id>` | Used for “price at date” and time-series context. The AI uses this when answering questions about past levels. |
| **Confidence & quality** | Same Hermes payload (price + confidence) | Displayed in the UI; used in client-side tools (e.g. confidence analyzer, volatility) to assess oracle quality. |

**Price IDs** are taken from the official Pyth mapping (crypto, stocks, FX, metals) and live in `server/pythService.ts`. No custom oracles — only **Pyth Network** feeds.

---

## How it works

- **Frontend:** React (Vite), TypeScript. Single origin; all data via `/api/*` (no direct external API calls from the client).
- **Backend:** Node.js + Express. One process serves both the SPA and the API.
- **Data flow:**  
  Client → Express `/api/*` → Pyth (Hermes + Benchmarks), Binance (klines), Jupiter (quotes), Gemini (chat). Responses are JSON (or SSE for the price stream).

So: **Pyth = real-time and historical truth for prices;** Binance = OHLC for chart candles; Jupiter = swap info; Gemini = conversational layer with Pyth-backed context.

---

## Run it

```bash
cd File-Explorer
npm install
npm run server
```

Open **http://localhost:5000**.  
Optional: set `GEMINI_API_KEY` in `.env` for the AI chat; Pyth Hermes/Benchmarks work without keys (subject to public rate limits).

---

## Stack (short)

| Layer | Tech |
|-------|------|
| UI | React 18, Vite, Tailwind, lightweight-charts |
| API | Express (Node), TypeScript |
| Prices & history | **Pyth Hermes** + **Pyth Benchmarks** |
| Charts (OHLC) | Binance API (proxy via backend) |
| AI | Google Gemini |
| Alerts (email) | Resend |

---

**By Nik0** — DeFi terminal powered by **Pyth Network** oracles.
