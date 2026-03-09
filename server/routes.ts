import type { Express, Request, Response } from 'express';
import type { Server } from 'http';
import {
  fetchPythPrices,
  fetchSinglePrice,
  fetchHistoricalPrice,
  getAllSupportedSymbols,
  getSymbolsByCategory,
} from './pythService.js';
import { chat } from './geminiService.js';
import {
  createAlert,
  getAlerts,
  deleteAlert,
  updateAlertPrice,
  triggerAlert,
  checkAlertCondition,
  getActiveAlerts,
} from './alertStore.js';
import { getSwapQuote, buildSwapTransaction, getSupportedSwapTokens } from './jupiterService.js';
import { Resend } from 'resend';

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0, янв: 0, января: 0,
  feb: 1, february: 1, фев: 1, февраля: 1,
  mar: 2, march: 2, март: 2, марта: 2,
  apr: 3, april: 3, апр: 3, апреля: 3,
  may: 4, май: 4, мая: 4, мае: 4,
  jun: 5, june: 5, июн: 5, июня: 5, июне: 5,
  jul: 6, july: 6, июл: 6, июля: 6, июле: 6,
  aug: 7, august: 7, авг: 7, августа: 7,
  sep: 8, september: 8, сен: 8, сентября: 8,
  oct: 9, october: 9, окт: 9, октября: 9,
  nov: 10, november: 10, ноя: 10, ноября: 10,
  dec: 11, december: 11, дек: 11, декабря: 11,
};

function parseHistoricalDate(text: string): number | null {
  const lower = text.toLowerCase();
  let d: Date | null = null;

  const isoMatch = lower.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    d = new Date(Date.UTC(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]));
  }

  if (!d) {
    const mdy = lower.match(/([a-zа-яё]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/);
    if (mdy && MONTH_MAP[mdy[1]] !== undefined) {
      d = new Date(Date.UTC(+mdy[3], MONTH_MAP[mdy[1]], +mdy[2]));
    }
  }

  if (!d) {
    const dmy = lower.match(/(\d{1,2})\s+([a-zа-яё]+)\s+(\d{4})/);
    if (dmy && MONTH_MAP[dmy[2]] !== undefined) {
      d = new Date(Date.UTC(+dmy[3], MONTH_MAP[dmy[2]], +dmy[1]));
    }
  }

  if (!d) return null;
  if (isNaN(d.getTime())) return null;
  const ts = Math.floor(d.getTime() / 1000);
  if (ts > Math.floor(Date.now() / 1000) - 3600) return null;
  return ts;
}

const HISTORICAL_SYMBOLS = [
  // Crypto
  'BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','DOT','SHIB','LINK','UNI','LTC','BCH','ATOM',
  'FIL','ICP','APT','ARB','OP','NEAR','INJ','SUI','SEI','TIA','JTO','PYTH','JUP','WIF','BONK',
  'PEPE','FLOKI','RENDER','TON','HBAR','TRX','ETC','XLM','ALGO','SAND','MANA','GRT','LDO','MKR',
  'AAVE','SNX','SUSHI','1INCH','DYDX','GMX','CRV','COMP','YFI','VET','MASK','BAT','STORJ','QTUM',
  'WAVES','HNT','ANKR','ICX','ZEC','DASH','ENJ','AXS','GALA','FET','LUNC','XTZ','IOTA','ZIL','USDC',
  // Stocks
  'AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN','META','NFLX','AMD','INTC','COIN','PYPL','UBER','SNAP',
  'BA','GS','JPM','BAC','C','MS','V','MA','WMT','TGT','COST','HD','LOW','NKE','SBUX','MCD','DIS',
  'CMCSA','T','PFE','JNJ','AMGN','MRNA','CVX','XOM','CSCO','IBM','ORCL','SAP','CRM','NOW','PLTR',
  'CRWD','DDOG','NET','ZS','SNOW','SHOP','EBAY','BABA','JD','PDD','NIO','XPEV','ABNB','RBLX',
  'HOOD','SOFI','AFRM','LYFT','ASML',
  // FX
  'EURUSD','GBPUSD','AUDUSD','NZDUSD','USDJPY','USDCHF','USDCAD','USDSGD','USDHKD','USDCNH',
  'USDKRW','USDTRY','USDBRL','USDMXN','USDINR','USDZAR','USDSEK','USDNOK','USDPLN',
  // Metals
  'XAUUSD','XAGUSD',
];

async function tryFetchHistoricalContext(messages: any[]): Promise<string> {
  const lastMsg: string = messages[messages.length - 1]?.content || '';
  const lower = lastMsg.toLowerCase();

  const hasDateKeyword = Object.keys(MONTH_MAP).some(k => lower.includes(k)) ||
    /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(lower) || /\b20\d{2}\b/.test(lower);
  if (!hasDateKeyword) return '';

  const symbol = HISTORICAL_SYMBOLS.find(s => lower.includes(s.toLowerCase()));
  if (!symbol) return '';

  const timestamp = parseHistoricalDate(lastMsg);
  if (!timestamp) return '';

  try {
    const hist = await fetchHistoricalPrice(symbol, timestamp);
    if (!hist) return '';
    const dateStr = new Date(timestamp * 1000).toUTCString();
    return `\n\n[PYTH BENCHMARKS HISTORICAL DATA — USE THIS IN YOUR ANSWER]\n` +
      `${hist.pair} on ${dateStr}: $${hist.price.toFixed(2)} (±$${hist.confidence.toFixed(2)} confidence)\n` +
      `Source: Pyth Network Benchmarks API (verified oracle data, timestamp: ${timestamp})`;
  } catch {
    return '';
  }
}

export async function registerRoutes(httpServer: Server, app: Express) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      gemini: !!(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || process.env.GEMINI_API_KEY),
      resend: !!process.env.RESEND_API_KEY,
      pyth: 'hermes.pyth.network',
    });
  });

  app.get('/api/pyth/prices', async (req, res) => {
    try {
      const symbols = req.query.symbols
        ? String(req.query.symbols).split(',')
        : getAllSupportedSymbols();
      const prices = await fetchPythPrices(symbols);
      res.json({ success: true, prices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/pyth/price/:symbol', async (req, res) => {
    try {
      const price = await fetchSinglePrice(req.params.symbol);
      if (!price) return res.status(404).json({ success: false, error: 'Symbol not found' });
      res.json({ success: true, price });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SSE streaming endpoint — pushes fresh prices every 2.5 seconds
  app.get('/api/pyth/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const category = req.query.category ? String(req.query.category) : 'crypto';
    const symbols = req.query.symbols
      ? String(req.query.symbols).split(',')
      : getSymbolsByCategory(category as any);

    let active = true;

    const push = async () => {
      if (!active) return;
      try {
        const prices = await fetchPythPrices(symbols, true);
        res.write(`data: ${JSON.stringify({ prices, ts: Date.now() })}\n\n`);
      } catch {
        res.write(`data: ${JSON.stringify({ error: 'fetch failed' })}\n\n`);
      }
    };

    push();
    const iv = setInterval(push, 2500);

    req.on('close', () => {
      active = false;
      clearInterval(iv);
    });
  });

  // Pyth Benchmarks — historical price at a specific timestamp
  app.get('/api/pyth/history', async (req, res) => {
    try {
      const symbol = String(req.query.symbol || '');
      const ts = parseInt(String(req.query.timestamp || '0'));
      if (!symbol || !ts) {
        return res.status(400).json({ success: false, error: 'symbol and timestamp required' });
      }
      const price = await fetchHistoricalPrice(symbol, ts);
      if (!price) return res.status(404).json({ success: false, error: 'No data for that timestamp' });
      res.json({ success: true, price });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, defaultEmail, walletPublicKey } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'messages array required' });
      }

      const symbols = getAllSupportedSymbols();
      const [pythPrices, historicalContext] = await Promise.all([
        fetchPythPrices(symbols),
        tryFetchHistoricalContext(messages),
      ]);
      const result = await chat(messages, pythPrices, defaultEmail, walletPublicKey, historicalContext);

      if (result.action?.action === 'create_alert') {
        const a = result.action;
        const currentPriceData = await fetchSinglePrice(a.symbol);
        const currentPrice = currentPriceData?.price ?? 0;

        const alert = createAlert({
          symbol: a.symbol,
          condition: a.condition,
          targetPrice: a.targetPrice,
          currentPrice,
          email: a.email || defaultEmail || '',
          note: a.note || '',
        });

        return res.json({
          success: true,
          content: result.content,
          action: result.action,
          alert,
        });
      }

      if (result.action?.action === 'prepare_swap') {
        return res.json({
          success: true,
          content: result.content,
          action: result.action,
        });
      }

      res.json({ success: true, content: result.content, action: result.action });
    } catch (err: any) {
      console.error('[Chat] error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Jupiter swap endpoints
  app.post('/api/swap/quote', async (req, res) => {
    try {
      const { fromToken, toToken, amount, slippageBps } = req.body;
      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({ success: false, error: 'fromToken, toToken, amount required' });
      }
      const quote = await getSwapQuote(fromToken, toToken, parseFloat(amount), slippageBps ?? 50);
      res.json({ success: true, quote });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swap/transaction', async (req, res) => {
    try {
      const { quoteResponse, userPublicKey } = req.body;
      if (!quoteResponse || !userPublicKey) {
        return res.status(400).json({ success: false, error: 'quoteResponse and userPublicKey required' });
      }
      const tx = await buildSwapTransaction(quoteResponse, userPublicKey);
      res.json({ success: true, ...tx });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/swap/tokens', (_req, res) => {
    res.json({ success: true, tokens: getSupportedSwapTokens() });
  });

  app.get('/api/alerts', (_req, res) => {
    res.json({ success: true, alerts: getAlerts() });
  });

  app.post('/api/alerts', async (req, res) => {
    try {
      const { symbol, condition, targetPrice, email, note } = req.body;
      if (!symbol || !condition || !targetPrice) {
        return res.status(400).json({ success: false, error: 'symbol, condition, targetPrice required' });
      }
      const priceData = await fetchSinglePrice(symbol);
      const alert = createAlert({
        symbol,
        condition,
        targetPrice: parseFloat(targetPrice),
        currentPrice: priceData?.price ?? 0,
        email: email || '',
        note: note || '',
      });
      res.json({ success: true, alert });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/alerts/:id', (req, res) => {
    const deleted = deleteAlert(req.params.id);
    res.json({ success: deleted });
  });

  app.post('/api/email', async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'to, subject, html required' });
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: 'RESEND_API_KEY not configured.' });
      }

      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: 'Akiro Labs <alerts@onboarding.resend.dev>',
        to,
        subject,
        html,
      });

      res.json({ success: true, id: result.data?.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  startAlertMonitor();
}

function buildAlertEmail(params: {
  symbol: string;
  condition: string;
  targetPrice: number;
  currentPrice: number;
  note: string;
}): string {
  const direction = params.condition === 'above' ? '🚀 crossed above' : '📉 dropped below';
  return `
    <div style="font-family:'Courier New',monospace;background:#0d1117;color:#e6edf3;padding:24px;border-radius:12px;max-width:500px;">
      <div style="border-bottom:1px solid #30363d;padding-bottom:16px;margin-bottom:16px;">
        <h1 style="color:#a78bfa;margin:0;font-size:24px;">⚡ AKIRO LABS</h1>
        <p style="color:#6e7681;margin:4px 0 0 0;font-size:12px;">Price Alert Triggered</p>
      </div>
      <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0;color:#8b949e;font-size:12px;">ALERT CONDITION</p>
        <p style="margin:8px 0 0 0;color:#e6edf3;font-size:18px;font-weight:bold;">
          ${params.symbol}/USD ${direction} $${params.targetPrice.toLocaleString()}
        </p>
        <p style="margin:8px 0 0 0;color:#3fb950;font-size:14px;">
          Current Price: <strong>$${params.currentPrice.toLocaleString()}</strong>
        </p>
        ${params.note ? `<p style="margin:8px 0 0 0;color:#8b949e;font-size:12px;font-style:italic;">${params.note}</p>` : ''}
      </div>
      <div style="background:#0d1117;border:1px solid #3d444d;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="margin:0;color:#6e7681;font-size:11px;">⚡ Powered by Pyth Network Oracle · Real-time price feeds on Solana</p>
      </div>
      <p style="color:#6e7681;font-size:11px;margin:0;">Configured in Akiro Labs Terminal.</p>
    </div>
  `;
}

async function sendAlertEmail(alert: any, currentPrice: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !alert.email) return;

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: 'Akiro Labs <alerts@onboarding.resend.dev>',
      to: alert.email,
      subject: `🔔 ${alert.symbol} Alert: $${alert.targetPrice.toLocaleString()} ${alert.condition === 'above' ? 'reached' : 'hit'}`,
      html: buildAlertEmail({
        symbol: alert.symbol,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        currentPrice,
        note: alert.note,
      }),
    });
    console.log(`[Alert] Email sent to ${alert.email} for ${alert.symbol}`);
  } catch (err) {
    console.error('[Alert] Email send failed:', err);
  }
}

function startAlertMonitor() {
  setInterval(async () => {
    const activeAlerts = getActiveAlerts();
    if (activeAlerts.length === 0) return;

    for (const alert of activeAlerts) {
      try {
        const priceData = await fetchSinglePrice(alert.symbol);
        if (!priceData) continue;
        updateAlertPrice(alert.id, priceData.price);
        if (checkAlertCondition(alert, priceData.price)) {
          triggerAlert(alert.id);
          await sendAlertEmail(alert, priceData.price);
          console.log(`[Alert] Triggered: ${alert.symbol} ${alert.condition} $${alert.targetPrice}`);
        }
      } catch (err) {
        console.error(`[Alert] Monitor error for ${alert.symbol}:`, err);
      }
    }
  }, 15000);

  console.log('[Alert] Monitor started (15s interval)');
}
