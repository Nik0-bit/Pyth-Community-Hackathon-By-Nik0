import type { Express } from 'express';
import type { Server } from 'http';
import { fetchPythPrices, fetchSinglePrice, getAllSupportedSymbols } from './pythService.js';
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
import { Resend } from 'resend';

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

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'messages array required' });
      }

      const symbols = getAllSupportedSymbols();
      const pythPrices = await fetchPythPrices(symbols);
      const result = await chat(messages, pythPrices);

      if (result.action?.action === 'create_alert') {
        const a = result.action;
        const currentPriceData = await fetchSinglePrice(a.symbol);
        const currentPrice = currentPriceData?.price ?? 0;

        const alert = createAlert({
          symbol: a.symbol,
          condition: a.condition,
          targetPrice: a.targetPrice,
          currentPrice,
          email: a.email || '',
          note: a.note || '',
        });

        return res.json({
          success: true,
          content: result.content,
          action: result.action,
          alert,
        });
      }

      res.json({ success: true, content: result.content, action: result.action });
    } catch (err: any) {
      console.error('[Chat] error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
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
      const { to, subject, html, resendApiKey } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'to, subject, html required' });
      }

      const apiKey = resendApiKey || process.env.RESEND_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: 'Resend API key not configured. Add RESEND_API_KEY to secrets.' });
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
