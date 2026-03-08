import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';

interface PriceFeed {
  pair: string;
  symbol: string;
  price: number;
  change24h: number;
  confidence: number;
}

const feedsConfig: PriceFeed[] = [
  { pair: 'BTC/USD', symbol: 'BTC', price: 67234.56, change24h: 2.34, confidence: 0.02 },
  { pair: 'SOL/USD', symbol: 'SOL', price: 148.23, change24h: 5.67, confidence: 0.15 },
  { pair: 'ETH/USD', symbol: 'ETH', price: 3456.78, change24h: 1.89, confidence: 0.05 },
  { pair: 'PYTH/USD', symbol: 'PYTH', price: 0.4567, change24h: -3.45, confidence: 0.10 },
  { pair: 'USDC/USD', symbol: 'USDC', price: 1.0, change24h: 0.01, confidence: 0.01 },
  { pair: 'BNB/USD', symbol: 'BNB', price: 589.34, change24h: 4.12, confidence: 0.08 },
  { pair: 'ADA/USD', symbol: 'ADA', price: 0.6789, change24h: -1.23, confidence: 0.12 },
];

export function RightSidebar() {
  const API_KEY = import.meta.env.VITE_COINMARKETCAP_API_KEY;
  const hasApiKey = Boolean(API_KEY && API_KEY.trim() !== '');

  const [feeds, setFeeds] = useState<PriceFeed[]>(feedsConfig);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPrices = async () => {
    if (!hasApiKey) return;

    try {
      const symbols = feedsConfig.map(f => f.symbol).join(',');
      const response = await fetch(
        `/cmc-api/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': API_KEY,
          }
        }
      );
      
      if (!response.ok) throw new Error(`CMC error: ${response.status}`);
      
      const data = await response.json();
      
      setFeeds(prevFeeds => 
        prevFeeds.map(feed => {
          const coinData = data.data?.[feed.symbol];
          if (!coinData) return feed;
          
          const price = coinData.quote.USD.price;
          const change24h = coinData.quote.USD.percent_change_24h;
          const volume24h = coinData.quote.USD.volume_24h;
          
          const confidence = volume24h > 10000000000 ? 0.01 : 
                           volume24h > 1000000000 ? 0.02 : 
                           volume24h > 100000000 ? 0.05 : 0.10;
          
          return { ...feed, price, change24h, confidence };
        })
      );
      
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices from CoinMarketCap:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-80 bg-[#0d1117] border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          <h2 
            className="text-lg tracking-wide" 
            style={{ fontFamily: 'Inter, sans-serif', color: '#3b82f6' }}
          >
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
        {lastUpdate && (
          <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {feeds.map((feed) => (
          <div 
            key={feed.pair}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div 
                  className="text-base mb-1" 
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}
                >
                  {feed.pair}
                </div>
                {hasApiKey ? (
                  <div 
                    className="text-2xl font-bold" 
                    style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      color: feed.change24h > 0 ? '#22c55e' : '#ef4444',
                      textShadow: feed.change24h > 0 
                        ? '0 0 20px rgba(34, 197, 94, 0.6)' 
                        : '0 0 20px rgba(239, 68, 68, 0.6)',
                    }}
                  >
                    ${feed.price.toFixed(feed.price < 10 ? 4 : 2)}
                  </div>
                ) : (
                  <div 
                    className="text-2xl font-bold text-purple-400"
                    style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      textShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
                    }}
                  >
                    SOON
                  </div>
                )}
              </div>
              {hasApiKey ? (
                <div className="flex items-center gap-1">
                  {feed.change24h > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400 animate-pulse" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 animate-pulse" />
                  )}
                  <span 
                    className={`text-sm font-bold ${feed.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                    style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      textShadow: feed.change24h > 0 
                        ? '0 0 10px rgba(34, 197, 94, 0.4)' 
                        : '0 0 10px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    {feed.change24h > 0 ? '+' : ''}{feed.change24h.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-purple-500/20 rounded-full">
                  <span 
                    className="text-xs text-purple-400 font-bold"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    SOON
                  </span>
                </div>
              )}
            </div>

            {/* Price Confidence Indicator */}
            {hasApiKey ? (
              <>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Confidence
                    </span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ±{(feed.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${Math.max(10, 100 - feed.confidence * 200)}%` }}
                    />
                  </div>
                </div>

                {/* Confidence Range */}
                <div className="mt-2 flex justify-between text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span className="text-red-400">
                    ${(feed.price * (1 - feed.confidence)).toFixed(feed.price < 10 ? 4 : 2)}
                  </span>
                  <span className="text-green-400">
                    ${(feed.price * (1 + feed.confidence)).toFixed(feed.price < 10 ? 4 : 2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="mt-2 text-center py-2">
                <span className="text-xs text-purple-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Add API key to see live data
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}