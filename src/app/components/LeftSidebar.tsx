import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Token {
  symbol: string;
  balance: number;
  value: number;
  change: number;
}

interface Trade {
  action: string;
  token: string;
  amount: string;
  time: string;
  success: boolean;
}

const tokens: Token[] = [
  { symbol: 'SOL', balance: 12.5, value: 1850.5, change: 5.2 },
  { symbol: 'USDC', balance: 5420.0, value: 5420.0, change: 0.0 },
  { symbol: 'PYTH', balance: 850.0, value: 425.0, change: -2.1 },
];

const recentTrades: Trade[] = [
  { action: 'Swap', token: 'SOL → USDC', amount: '2.5 SOL', time: '2m ago', success: true },
  { action: 'Price Check', token: 'BTC/USD', amount: '$67,234', time: '5m ago', success: true },
  { action: 'Compare', token: 'SOL vs ETH', amount: 'Vol Analysis', time: '12m ago', success: true },
];

export function LeftSidebar() {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_COINMARKETCAP_API_KEY;
    setHasApiKey(!!apiKey && apiKey.trim() !== '');
  }, []);

  return (
    <div className="w-80 bg-[#0d1117] border-r border-gray-800 flex flex-col overflow-hidden">
      {/* My Wallet Section */}
      <div className="p-6 border-b border-gray-800">
        <h2 
          className="text-lg mb-4 tracking-wide" 
          style={{ fontFamily: 'Inter, sans-serif', color: '#a78bfa' }}
        >
          MY WALLET
        </h2>
        <div className="space-y-3">
          {tokens.map((token) => (
            <div 
              key={token.symbol} 
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <span 
                  className="text-lg" 
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}
                >
                  {token.symbol}
                </span>
                <div className="flex items-center gap-1">
                  {hasApiKey ? (
                    <>
                      {token.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : token.change < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                      <span 
                        className={`text-sm ${token.change > 0 ? 'text-green-400' : token.change < 0 ? 'text-red-400' : 'text-gray-400'}`}
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {token.change > 0 ? '+' : ''}{token.change}%
                      </span>
                    </>
                  ) : (
                    <span 
                      className="text-xs text-purple-400 font-bold px-2 py-1 bg-purple-500/20 rounded"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      SOON
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {token.balance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {hasApiKey ? `$${token.value.toFixed(2)}` : (
                  <span className="text-purple-400">SOON</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="p-6 flex-1 overflow-auto">
        <h2 
          className="text-lg mb-4 tracking-wide" 
          style={{ fontFamily: 'Inter, sans-serif', color: '#3b82f6' }}
        >
          RECENT TRADES
        </h2>
        <div className="space-y-3">
          {recentTrades.map((trade, idx) => (
            <div 
              key={idx}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {trade.action}
                </span>
                <ArrowUpRight className="w-3 h-3 text-green-400" />
              </div>
              <div className="text-sm" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>
                {trade.token}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-blue-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {hasApiKey ? trade.amount : (
                    <span className="text-purple-400">SOON</span>
                  )}
                </span>
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {trade.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}