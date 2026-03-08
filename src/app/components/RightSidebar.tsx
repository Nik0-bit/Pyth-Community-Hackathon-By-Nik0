import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, Bell } from 'lucide-react';
import { api, type PythPrice } from '../services/apiService';

const DEFAULT_SYMBOLS = ['BTC', 'SOL', 'ETH', 'PYTH', 'USDC', 'BNB', 'ADA', 'JUP'];

interface AlertCreatedCallback {
  (symbol: string, condition: 'above' | 'below', targetPrice: number): void;
}

interface RightSidebarProps {
  onQuickAlert?: AlertCreatedCallback;
}

export function RightSidebar({ onQuickAlert }: RightSidebarProps) {
  const [prices, setPrices] = useState<PythPrice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const result = await api.getPythPrices(DEFAULT_SYMBOLS);
      if (result.success && result.prices.length > 0) {
        setPrices(result.prices);
        setIsConnected(true);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching Pyth prices:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return (
    <div className="w-80 bg-[#0d1117] border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          <h2 className="text-lg tracking-wide" style={{ fontFamily: 'Inter, sans-serif', color: '#3b82f6' }}>
            PYTH LIVE FEED
          </h2>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
          )}
        </div>
        <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          Real-time price oracles with confidence intervals
        </p>
        <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading && prices.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Connecting to Pyth Network...
            </p>
          </div>
        )}

        {prices.map(feed => (
          <div
            key={feed.symbol}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-300 group"
            data-testid={`price-card-${feed.symbol}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div
                  className="text-base mb-1"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}
                >
                  {feed.pair}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: feed.change24h >= 0 ? '#22c55e' : '#ef4444',
                    textShadow: feed.change24h >= 0
                      ? '0 0 20px rgba(34, 197, 94, 0.6)'
                      : '0 0 20px rgba(239, 68, 68, 0.6)',
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
                    <TrendingUp className="w-4 h-4 text-green-400 animate-pulse" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 animate-pulse" />
                  )}
                  <span
                    className={`text-sm font-bold ${feed.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
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

            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Pyth Confidence
                </span>
                <span className="text-xs text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  ±${feed.confidence.toFixed(feed.price < 10 ? 6 : 2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(10, 100 - (feed.confidence / feed.price) * 10000)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-2 flex justify-between text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <span className="text-red-400/70">
                ${(feed.price - feed.confidence).toLocaleString(undefined, { maximumFractionDigits: feed.price < 10 ? 4 : 2 })}
              </span>
              <span className="text-xs text-gray-600">oracle range</span>
              <span className="text-green-400/70">
                ${(feed.price + feed.confidence).toLocaleString(undefined, { maximumFractionDigits: feed.price < 10 ? 4 : 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
