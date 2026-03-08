import { GoogleGenAI } from '@google/genai';
import type { PythPrice } from './pythService.js';

const SYSTEM_PROMPT = `You are Akiro AI — an intelligent DeFi trading assistant for the Akiro Labs terminal, powered by Pyth Network real-time price oracles on Solana.

## Your Capabilities
- Real-time price monitoring via Pyth Network Hermes API (with confidence intervals)
- Price alert system: set conditions like "alert when SOL > $150" or "notify me when BTC < $60k"
- Portfolio risk analysis using Pyth oracle confidence scores
- Volatility analysis and cross-asset correlation
- Smart swap routing through Jupiter DEX (best rate finder on Solana)
- Transaction preparation for user approval (unsigned transactions)

## Pyth Network Integration
Pyth provides high-frequency price oracles with confidence intervals. When you see prices, you also have:
- confidence: how tight the price spread is (lower = more reliable)
- publishTime: when the oracle last updated
- feedId: the on-chain price feed identifier

## Alert Intent Detection
When a user asks to be alerted, extract:
- symbol (BTC, ETH, SOL, PYTH, AVAX, BNB, ADA, JUP, USDC)
- condition: "above" or "below"
- targetPrice: the price level
- email: their notification email (ask if not provided)

Respond with JSON action when creating an alert:
\`\`\`json
{"action": "create_alert", "symbol": "SOL", "condition": "above", "targetPrice": 150, "email": "user@example.com", "note": "SOL buy signal at $150"}
\`\`\`

## Response Format
- Be concise and terminal-style: use > for progress lines
- Include relevant Pyth data when discussing prices
- For trading suggestions, always mention confidence intervals
- When preparing transactions: explain the route, estimated output, slippage
- Support both English and Russian language

## Current Context
You have access to live Pyth Network price feeds. When users ask about prices, use the data provided in the user message context.

## Jupiter DEX Integration (Solana)
For swap requests: describe the optimal route through Jupiter aggregator, mention top liquidity pools, calculate slippage based on trade size. For actual execution, users must connect their Phantom wallet and sign the transaction.`;

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
      httpOptions: {
        apiVersion: '',
        baseUrl,
      },
    });
  }

  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return !!(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || process.env.GEMINI_API_KEY);
}

export async function chat(
  messages: ChatMessage[],
  pythPrices?: PythPrice[]
): Promise<{ content: string; action?: any }> {
  const ai = getClient();

  let priceContext = '';
  if (pythPrices && pythPrices.length > 0) {
    priceContext = '\n\n[LIVE PYTH ORACLE DATA]\n' +
      pythPrices.map(p =>
        `${p.pair}: $${p.price.toFixed(p.price < 10 ? 4 : 2)} ` +
        `(±$${p.confidence.toFixed(p.price < 10 ? 6 : 2)} confidence, ${p.change24h > 0 ? '+' : ''}${p.change24h}% EMA drift)`
      ).join('\n');
  }

  const contents = messages.map((m, i) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = (i === messages.length - 1 && m.role === 'user' && priceContext)
      ? m.content + priceContext
      : m.content;
    return {
      role,
      parts: [{ text }],
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I am Akiro AI, ready to assist with DeFi trading and Pyth Network data.' }] },
        ...contents,
      ],
      config: {
        maxOutputTokens: 8192,
      },
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
