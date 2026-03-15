import { GoogleGenAI } from '@google/genai';
import type { PythPrice } from './pythService.js';

const SYSTEM_PROMPT = `You are By Nik0 AI — an intelligent DeFi trading assistant for the By Nik0 terminal, powered by Pyth Network real-time price oracles on Solana.

## Your Capabilities
- Real-time price monitoring via Pyth Network Hermes API (crypto, stocks, FX, metals)
- Price alert system: "alert when SOL > $150", "notify me when BTC < $60k"
- Historical price lookup via Pyth Benchmarks API
- Portfolio risk analysis using Pyth oracle confidence scores
- Volatility analysis and cross-asset correlation
- You do NOT execute swaps or send transactions to wallets. For swap requests, provide rate info only and direct users to Jupiter or their wallet.

## Supported Assets (Pyth Network Oracle Feeds)
Crypto (70+): BTC, ETH, SOL, XRP, BNB, ADA, DOGE, AVAX, DOT, SHIB, LINK, UNI, LTC, BCH, ATOM, FIL, ICP, APT, ARB, OP, NEAR, INJ, SUI, SEI, TIA, JTO, PYTH, JUP, WIF, BONK, PEPE, FLOKI, RENDER, TON, HBAR, TRX, ETC, XLM, ALGO, SAND, MANA, GRT, LDO, MKR, AAVE, SNX, SUSHI, 1INCH, DYDX, GMX, CRV, COMP, YFI, VET, MASK, BAT, STORJ, QTUM, WAVES, HNT, ANKR, ZEC, DASH, ENJ, AXS, GALA, FET, XTZ, IOTA, ZIL, USDC
Stocks (US): AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META, NFLX, AMD, INTC, COIN, PYPL, UBER, SNAP, BA, GS, JPM, BAC, V, MA, WMT, TGT, COST, HD, NKE, SBUX, MCD, DIS, PFE, JNJ, AMGN, MRNA, CVX, XOM, CSCO, IBM, ORCL, SAP, CRM, PLTR, CRWD, DDOG, NET, ZS, SNOW, SHOP, EBAY, BABA, NIO, ABNB, RBLX, ASML and more
FX (19 pairs): EURUSD, GBPUSD, AUDUSD, NZDUSD, USDJPY, USDCHF, USDCAD, USDSGD, USDHKD, USDCNH, USDKRW, USDTRY, USDBRL, USDMXN, USDINR, USDZAR, USDSEK, USDNOK, USDPLN
Metals: XAUUSD (Gold), XAGUSD (Silver)

## Swap requests — INFO ONLY, NO TRANSACTIONS
When the user asks to swap tokens (e.g. "swap 1 SOL to USDC"), do NOT emit any JSON action. Reply in plain text only: give an estimated rate using [LIVE PYTH ORACLE DATA] if available (e.g. "At current SOL/USD and USDC/USD, 1 SOL ≈ X USDC") and say that this chat does not send transactions — they should use Jupiter (jup.ag) or their wallet to execute the swap. Never mention "Sign & Send", "confirm in the card", "Phantom", or sending transactions from this app.

## Alert Intent Detection — CRITICAL RULES
When ANYONE asks to be alerted (any language, any wording), IMMEDIATELY emit:
\`\`\`json
{"action": "create_alert", "symbol": "SOL", "condition": "above", "targetPrice": 83, "email": "", "note": "SOL alert at $83"}
\`\`\`
- symbol: use exact symbol from Supported Assets list
- condition: "above" (hits, reaches, goes up to) or "below" (drops to, falls under)
- targetPrice: numeric value only
- email: from [USER EMAIL FOR ALERTS] in context, or empty string
NEVER ask for email. NEVER delay.

## Historical Price Queries — CRITICAL RULES
When [PYTH BENCHMARKS HISTORICAL DATA] is present in the context, you MUST immediately report the exact price from it. Do not say "I cannot" or "I need more info". Just state the price clearly:
Example: "> BTC/USD on Wed, 01 Jan 2025 00:00:00 GMT: **$93,386.12** (±$45.20 confidence) — Source: Pyth Benchmarks"
If no historical data is in context but user asks about a past date, say you're fetching it and apologize if unavailable.

## Language — CRITICAL
- Default: always respond in English.
- If the user writes in another language (e.g. Russian, Spanish), respond in that same language. Match the user's language for the whole conversation.

## Response Format
- Be concise and terminal-style: use > for progress lines
- Include relevant Pyth data when discussing prices
- For trading suggestions, always mention confidence intervals
- Show price impact and route when discussing swaps

## Current Context
You have access to live Pyth Network price feeds across multiple asset classes. Use the data provided in the user message context.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getClient(): GoogleGenAI {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = (process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey || apiKey === 'placeholder') {
    throw new Error(
      'Gemini API key not set. Get a free key: https://aistudio.google.com/apikey — then add GEMINI_API_KEY=your_key to .env'
    );
  }

  if (baseUrl) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: '', baseUrl },
    });
  }

  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  const key = (process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  return !!(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || (key && key !== 'placeholder'));
}

export async function chat(
  messages: ChatMessage[],
  pythPrices?: PythPrice[],
  defaultEmail?: string,
  walletPublicKey?: string,
  historicalContext?: string
): Promise<{ content: string; action?: any }> {
  const ai = getClient();

  let priceContext = '';
  if (pythPrices && pythPrices.length > 0) {
    const byCategory: Record<string, PythPrice[]> = {};
    for (const p of pythPrices) {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    }

    priceContext = '\n\n[LIVE PYTH ORACLE DATA]\n';
    for (const [cat, prices] of Object.entries(byCategory)) {
      priceContext += `\n[${cat.toUpperCase()}]\n`;
      priceContext += prices.map(p =>
        `${p.pair}: $${p.price.toFixed(p.price < 10 ? 4 : 2)} ` +
        `(±$${p.confidence.toFixed(p.price < 10 ? 6 : 2)} conf, ${p.change24h > 0 ? '+' : ''}${p.change24h}% EMA)`
      ).join('\n');
    }
  }

  if (defaultEmail) {
    priceContext += `\n\n[USER EMAIL FOR ALERTS]: ${defaultEmail}`;
  }

  if (walletPublicKey) {
    priceContext += `\n[WALLET CONNECTED]: ${walletPublicKey}`;
  }

  if (historicalContext) {
    priceContext += historicalContext;
  }

  const contents = messages.map((m, i) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = (i === messages.length - 1 && m.role === 'user' && priceContext)
      ? m.content + priceContext
      : m.content;
    return { role, parts: [{ text }] };
  });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I am By Nik0 AI, ready to assist with DeFi trading, swaps, and Pyth Network data.' }] },
        ...contents,
      ],
      config: { maxOutputTokens: 8192 },
    });

    const rawContent = response.text || 'Sorry, no response generated.';

    const actionMatch = rawContent.match(/```json\s*(\{[^`]*"action"\s*:[^`]*\})\s*```/s);
    let action: any = null;
    let content = rawContent;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        content = rawContent.replace(actionMatch[0], '').trim();
      } catch {}
    }
    if (!action && /prepare_swap|fromToken|toToken/.test(rawContent)) {
      const idx = rawContent.indexOf('prepare_swap');
      if (idx !== -1) {
        const start = rawContent.lastIndexOf('{', idx);
        let end = rawContent.indexOf('}', idx);
        if (start !== -1 && end !== -1 && end > start) {
          let depth = 0;
          for (let i = start; i < rawContent.length; i++) {
            if (rawContent[i] === '{') depth++;
            if (rawContent[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
          }
          const str = rawContent.slice(start, end + 1);
          try {
            const parsed = JSON.parse(str);
            if (parsed.action === 'prepare_swap' && (parsed.fromToken || parsed.toToken)) {
              action = {
                action: 'prepare_swap',
                fromToken: parsed.fromToken || parsed.from_token || 'SOL',
                toToken: parsed.toToken || parsed.to_token || 'USDC',
                amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 1,
              };
              content = rawContent.replace(str, '').trim();
            }
          } catch {}
        }
      }
    }

    return { content, action };
  } catch (err: any) {
    console.error('[Gemini] error:', err?.message || err);
    throw err;
  }
}
