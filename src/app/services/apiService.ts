export interface PythPrice {
  symbol: string;
  pair: string;
  price: number;
  confidence: number;
  change24h: number;
  publishTime: number;
  feedId: string;
}

export type AlertCondition = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'cancelled';

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  email: string;
  note: string;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  progress: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  action?: any;
  alert?: PriceAlert;
  error?: string;
}

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  async getPythPrices(symbols?: string[]): Promise<{ success: boolean; prices: PythPrice[] }> {
    const q = symbols ? `?symbols=${symbols.join(',')}` : '';
    return req(`/pyth/prices${q}`);
  },

  async getSinglePrice(symbol: string): Promise<{ success: boolean; price: PythPrice }> {
    return req(`/pyth/price/${symbol}`);
  },

  async chat(messages: ChatMessage[], defaultEmail?: string): Promise<ChatResponse> {
    return req('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, defaultEmail }),
    });
  },

  async getAlerts(): Promise<{ success: boolean; alerts: PriceAlert[] }> {
    return req('/alerts');
  },

  async createAlert(params: {
    symbol: string;
    condition: AlertCondition;
    targetPrice: number;
    email: string;
    note?: string;
  }): Promise<{ success: boolean; alert: PriceAlert }> {
    return req('/alerts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async deleteAlert(id: string): Promise<{ success: boolean }> {
    return req(`/alerts/${id}`, { method: 'DELETE' });
  },

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    resendApiKey?: string;
  }): Promise<{ success: boolean; id?: string }> {
    return req('/email', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getHealth(): Promise<{ status: string; gemini: boolean; resend: boolean; pyth: string }> {
    return req('/health');
  },
};
