import { GoogleGenAI } from '@google/genai';
import type { PythPrice } from './pythService.js';

const SYSTEM_PROMPT = `You are Akiro AI — an intelligent DeFi trading assistant for the Akiro Labs terminal, powered by Pyth Network real-time price oracles on Solana.

## Your Capabilities
- Real-time price monitoring via Pyth Network Hermes API (crypto, stocks, FX, metals)
- Price alert system: "alert when SOL > $150", "notify me when BTC < $60k"
- Historical price lookup via Pyth Benchmarks API
- Smart swap execution through Jupiter DEX with real transaction building
- Portfolio risk analysis using Pyth oracle confidence scores
- Volatility analysis and cross-asset correlation

## Supported Assets
Crypto: BTC, ETH, SOL, PYTH, AVAX, BNB, ADA, JUP, USDC
Stocks (US, market hours): AAPL, TSLA, NVDA, MSFT
FX: EURUSD (EUR/USD), GBPUSD (GBP/USD)
Metals: XAUUSD (XAU/USD Gold)

## Swap Tokens (Jupiter DEX)
SOL, USDC, USDT, ETH, BTC, JUP, PYTH, BNB, ADA

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

## Swap Transaction Intent — CRITICAL RULES
When user wants to swap/exchange tokens (e.g. "swap 1 SOL to USDC", "обменяй 5 SOL на USDC", "trade 10 JUP for SOL"), emit:
\`\`\`json
{"action": "prepare_swap", "fromToken": "SOL", "toToken": "USDC", "amount": 1.0, "note": "Swap 1 SOL → USDC via Jupiter"}
\`\`\`
- fromToken and toToken must be from the Swap Tokens list
- amount: numeric value
- Always confirm the swap details in your text response before emitting the JSON
- The user's wallet must be connected for the swap to execute

## Historical Price Queries
When users ask about past prices ("what was BTC price on Jan 3?", "price of SOL yesterday"), tell them you can look up historical Pyth Benchmark data and provide the information from the context if available.

## Response Format
- Be concise and terminal-style: use > for progress lines
- Include relevant Pyth data when discussing prices
- For trading suggestions, always mention confidence intervals
- Show price impact and route when discussing swaps
- Support both English and Russian language

## Current Context
You have access to live Pyth Network price feeds across multiple asset classes. Use the data provided in the user message context.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getClient(): GoogleGenAI {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'placeholder';

  if (baseUrl) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: '', baseUrl },
    });
  }

  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return !!(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || process.env.GEMINI_API_KEY);
}

export async function chat(
  messages: ChatMessage[],
  pythPrices?: PythPrice[],
  defaultEmail?: string,
  walletPublicKey?: string
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

  const contents = messages.map((m, i) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = (i === messages.length - 1 && m.role === 'user' && priceContext)
      ? m.content + priceContext
      : m.content;
    return { role, parts: [{ text }] };
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I am Akiro AI, ready to assist with DeFi trading, swaps, and Pyth Network data.' }] },
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

    return { content, action };
  } catch (err: any) {
    console.error('[Gemini] error:', err?.message || err);
    throw err;
  }
}
