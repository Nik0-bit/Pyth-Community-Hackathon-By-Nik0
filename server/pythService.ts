export interface PythPrice {
  symbol: string;
  pair: string;
  price: number;
  confidence: number;
  change24h: number;
  publishTime: number;
  feedId: string;
  category: 'crypto' | 'stock' | 'fx' | 'metal';
}

export const PYTH_PRICE_IDS: Record<string, string> = {
  // Crypto
  BTC:    '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH:    '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL:    '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  PYTH:   '0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff',
  AVAX:   '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  BNB:    '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  ADA:    '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  JUP:    '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
  USDC:   '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  // Stocks (US Equities)
  AAPL:   '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  TSLA:   '0x42676a595d0099c381687124805c8bb22c75424dffcaa55e3dc6549854ebe20a',
  NVDA:   '0x61c4ca5b9731a79e285a01e24432d57d89f0ecdd4cd7828196ca8992d5eafef6',
  MSFT:   '0x8f98f8267ddddeeb61b4fd11f21dc0c2842c417622b4d685243fa73b5830131f',
  // FX
  EURUSD: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  GBPUSD: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  // Metals
  XAUUSD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
};

const SYMBOL_CATEGORY: Record<string, PythPrice['category']> = {
  BTC: 'crypto', ETH: 'crypto', SOL: 'crypto', PYTH: 'crypto',
  AVAX: 'crypto', BNB: 'crypto', ADA: 'crypto', JUP: 'crypto', USDC: 'crypto',
  AAPL: 'stock', TSLA: 'stock', NVDA: 'stock', MSFT: 'stock',
  EURUSD: 'fx', GBPUSD: 'fx',
  XAUUSD: 'metal',
};

const SYMBOL_PAIR: Record<string, string> = {
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', XAUUSD: 'XAU/USD',
};

const priceCache: Record<string, { data: PythPrice; ts: number }> = {};
const CACHE_TTL = 2500;

async function hermesHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = {};
  if (process.env.PYTH_API_KEY) h['x-api-key'] = process.env.PYTH_API_KEY;
  return h;
}

export async function fetchPythPrices(symbols: string[], bypassCache = false): Promise<PythPrice[]> {
  const upper = symbols.map(s => s.toUpperCase());
  const toFetch = bypassCache
    ? upper.filter(s => PYTH_PRICE_IDS[s])
    : upper.filter(s => {
        const c = priceCache[s];
        return !c || Date.now() - c.ts > CACHE_TTL;
      });

  if (toFetch.length > 0) {
    const ids = toFetch.map(s => PYTH_PRICE_IDS[s]).filter(Boolean);
    if (ids.length > 0) {
      const url = `https://hermes.pyth.network/v2/updates/price/latest?${ids.map(id => `ids[]=${id}`).join('&')}`;
      try {
        const headers = await hermesHeaders();
        const res = await globalThis.fetch(url, { headers });
        if (!res.ok) throw new Error(`Hermes HTTP ${res.status}`);
        const data = await res.json() as any;
        const parsed: any[] = data.parsed || [];

        for (const item of parsed) {
          const feedId = '0x' + item.id;
          const sym = Object.entries(PYTH_PRICE_IDS).find(([, v]) => v === feedId)?.[0];
          if (!sym) continue;

          const expo = item.price.expo;
          const price = parseFloat(item.price.price) * Math.pow(10, expo);
          const conf = parseFloat(item.price.conf) * Math.pow(10, expo);
          const emaPrice = parseFloat(item.ema_price.price) * Math.pow(10, item.ema_price.expo);
          const change24h = price > 0 ? ((price - emaPrice) / emaPrice) * 100 : 0;

          priceCache[sym] = {
            ts: Date.now(),
            data: {
              symbol: sym,
              pair: SYMBOL_PAIR[sym] ?? `${sym}/USD`,
              price,
              confidence: conf,
              change24h: parseFloat(change24h.toFixed(2)),
              publishTime: item.price.publish_time,
              feedId,
              category: SYMBOL_CATEGORY[sym] ?? 'crypto',
            },
          };
        }
      } catch (err) {
        console.error('[Pyth] fetch error:', err);
      }
    }
  }

  return upper
    .map(s => priceCache[s]?.data)
    .filter((p): p is PythPrice => !!p);
}

export async function fetchSinglePrice(symbol: string): Promise<PythPrice | null> {
  const results = await fetchPythPrices([symbol.toUpperCase()]);
  return results[0] ?? null;
}

export function getAllSupportedSymbols(): string[] {
  return Object.keys(PYTH_PRICE_IDS);
}

export function getSymbolsByCategory(category: PythPrice['category']): string[] {
  return Object.keys(PYTH_PRICE_IDS).filter(s => SYMBOL_CATEGORY[s] === category);
}

export interface HistoricalPrice {
  symbol: string;
  pair: string;
  price: number;
  confidence: number;
  timestamp: number;
  feedId: string;
}

export async function fetchHistoricalPrice(symbol: string, timestamp: number): Promise<HistoricalPrice | null> {
  const sym = symbol.toUpperCase();
  const feedId = PYTH_PRICE_IDS[sym];
  if (!feedId) return null;

  const rawId = feedId.startsWith('0x') ? feedId.slice(2) : feedId;
  const url = `https://benchmarks.pyth.network/v1/updates/price/${timestamp}?ids=${rawId}`;

  try {
    const headers = await hermesHeaders();
    const res = await globalThis.fetch(url, { headers });
    if (!res.ok) throw new Error(`Benchmarks HTTP ${res.status}`);
    const data = await res.json() as any;
    const parsed: any[] = data.parsed || [];
    if (parsed.length === 0) return null;

    const item = parsed[0];
    const expo = item.price.expo;
    const price = parseFloat(item.price.price) * Math.pow(10, expo);
    const conf = parseFloat(item.price.conf) * Math.pow(10, expo);

    return {
      symbol: sym,
      pair: SYMBOL_PAIR[sym] ?? `${sym}/USD`,
      price,
      confidence: conf,
      timestamp: item.price.publish_time,
      feedId: '0x' + item.id,
    };
  } catch (err) {
    console.error('[Pyth Benchmarks] error:', err);
    return null;
  }
}
