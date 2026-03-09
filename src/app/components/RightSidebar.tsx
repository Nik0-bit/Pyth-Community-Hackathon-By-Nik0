import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, Bell, Cpu } from 'lucide-react';
import type { PythPrice } from '../services/apiService';

const CATEGORIES = [
  { key: 'crypto', label: 'Crypto', symbols: [
    'BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','DOT','SHIB',
    'LINK','UNI','LTC','BCH','ATOM','FIL','ICP','APT','ARB','OP',
    'NEAR','INJ','SUI','SEI','TIA','JTO','PYTH','JUP','WIF','BONK',
    'PEPE','FLOKI','RENDER','TON','HBAR','TRX','ETC','XLM','ALGO','SAND',
    'MANA','GRT','LDO','MKR','AAVE','SNX','SUSHI','1INCH','DYDX','GMX',
    'CRV','COMP','YFI','VET','MASK','BAT','FET','AXS','GALA','ENJ',
    'WAVES','QTUM','HNT','DASH','ZEC','LUNC','XTZ','IOTA','ZIL','USDC',
  ]},
  { key: 'stock', label: 'Stocks', symbols: [
    'AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN','META','NFLX','AMD','INTC',
    'COIN','PYPL','UBER','SNAP','BA','GS','JPM','BAC','C','MS',
    'V','MA','WMT','TGT','COST','HD','LOW','NKE','SBUX','MCD',
    'DIS','CMCSA','T','PFE','JNJ','AMGN','MRNA','CVX','XOM','CSCO',
    'IBM','ORCL','SAP','CRM','NOW','PLTR','CRWD','DDOG','NET','ZS',
    'SNOW','SHOP','EBAY','BABA','JD','PDD','NIO','XPEV','ABNB','RBLX',
    'HOOD','SOFI','AFRM','LYFT','ASML',
  ]},
  { key: 'fx', label: 'FX', symbols: [
    'EURUSD','GBPUSD','AUDUSD','NZDUSD','USDJPY','USDCHF','USDCAD',
    'USDSGD','USDHKD','USDCNH','USDKRW','USDTRY','USDBRL','USDMXN',
    'USDINR','USDZAR','USDSEK','USDNOK','USDPLN',
  ]},
  { key: 'metal', label: 'Metals', symbols: ['XAUUSD','XAGUSD'] },
];

interface AlertCreatedCallback {
  (symbol: string, condition: 'above' | 'below', targetPrice: number): void;
}

interface RightSidebarProps {
  onQuickAlert?: AlertCreatedCallback;
}

export function RightSidebar({ onQuickAlert }: RightSidebarProps) {
  const [activeCategory, setActiveCategory] = useState('crypto');
  const [prices, setPrices] = useState<PythPrice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [tickMap, setTickMap] = useState<Record<string, boolean>>({});
  const esRef = useRef<EventSource | null>(null);
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setLoading(true);
    setIsConnected(false);
    setPrices([]);

    const cat = CATEGORIES.find(c => c.key === activeCategory);
    if (!cat) return;

    const symbols = cat.symbols.join(',');
    const es = new EventSource(`/api/pyth/stream?symbols=${symbols}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.prices && Array.isArray(data.prices)) {
          setLoading(false);
          setIsConnected(true);
          setLastUpdate(new Date());

          const newTicks: Record<string, boolean> = {};
          data.prices.forEach((p: PythPrice) => {
            const prev = prevPricesRef.current[p.symbol];
            if (prev !== undefined && prev !== p.price) {
              newTicks[p.symbol] = true;
            }
            prevPricesRef.current[p.symbol] = p.price;
          });

          if (Object.keys(newTicks).length > 0) {
            setTickMap(prev => ({ ...prev, ...newTicks }));
            setTimeout(() => {
              setTickMap(prev => {
                const next = { ...prev };
                Object.keys(newTicks).forEach(k => delete next[k]);
                return next;
              });
            }, 500);
          }

          setPrices(data.prices);
        }
      } catch {}
    };

    es.onerror = () => {
      setIsConnected(false);
      setLoading(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [activeCategory]);

  return (
    <div className="w-80 bg-[#0d1117] border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <h2 className="text-sm tracking-widest font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#3b82f6' }}>
            PYTH LIVE FEED
          </h2>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Wifi className="w-3 h-3" /> SSE
            </span>
          ) : (
            <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {lastUpdate.toLocaleTimeString()} · 2.5s stream
        </p>

        <div className="flex gap-1 mt-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-1 py-1.5 text-xs rounded transition-all flex flex-col items-center gap-0.5 ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
              data-testid={`tab-${cat.key}`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9px] ${activeCategory === cat.key ? 'text-blue-200' : 'text-gray-600'}`}>
                {cat.symbols.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading && prices.length === 0 && (
          <div className="text-center py-8">
            <Cpu className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Connecting to stream...
            </p>
          </div>
        )}

        {!loading && prices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {activeCategory === 'stock' ? 'Market closed (US hours only)' : 'No data available'}
            </p>
          </div>
        )}

        {prices.map(feed => {
          const isTicking = tickMap[feed.symbol];
          return (
            <div
              key={feed.symbol}
              className={`bg-gray-900/50 border rounded-lg p-3 transition-all duration-300 group ${
                isTicking
                  ? 'border-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'border-gray-800 hover:border-blue-500/40'
              }`}
              data-testid={`price-card-${feed.symbol}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {feed.pair}
                    </span>
                    {isTicking && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block" />
                    )}
                  </div>
                  <div
                    className={`text-xl font-bold transition-all duration-200 ${isTicking ? 'scale-105' : 'scale-100'}`}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      color: feed.change24h >= 0 ? '#22c55e' : '#ef4444',
                      textShadow: feed.change24h >= 0
                        ? '0 0 16px rgba(34,197,94,0.5)'
                        : '0 0 16px rgba(239,68,68,0.5)',
                      display: 'inline-block',
                    }}
                    data-testid={`price-value-${feed.symbol}`}
                  >
                    ${feed.price.toLocaleString(undefined, {
                      minimumFractionDigits: feed.price < 10 ? 4 : 2,
                      maximumFractionDigits: feed.price < 10 ? 4 : 2,
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    {feed.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={`text-xs font-bold ${feed.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      data-testid={`change-${feed.symbol}`}
                    >
                      {feed.change24h >= 0 ? '+' : ''}{feed.change24h.toFixed(2)}%
                    </span>
                  </div>
                  {onQuickAlert && (
                    <button
                      onClick={() => {
                        const condition = feed.change24h >= 0 ? 'above' : 'below';
                        const offset = feed.price * 0.05;
                        const target = condition === 'above'
                          ? parseFloat((feed.price + offset).toFixed(2))
                          : parseFloat((feed.price - offset).toFixed(2));
                        onQuickAlert(feed.symbol, condition, target);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-400"
                      title={`Quick alert for ${feed.symbol}`}
                      data-testid={`quick-alert-${feed.symbol}`}
                    >
                      <Bell className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Confidence
                  </span>
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    ±${feed.confidence.toFixed(feed.price < 10 ? 6 : 2)}
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${Math.max(10, 100 - (feed.confidence / feed.price) * 10000)}%` }}
                  />
                </div>
              </div>

              <div className="mt-1.5 flex justify-between text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <span className="text-red-400/60">
                  ${(feed.price - feed.confidence).toLocaleString(undefined, { maximumFractionDigits: feed.price < 10 ? 4 : 2 })}
                </span>
                <span className="text-gray-700">range</span>
                <span className="text-green-400/60">
                  ${(feed.price + feed.confidence).toLocaleString(undefined, { maximumFractionDigits: feed.price < 10 ? 4 : 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
