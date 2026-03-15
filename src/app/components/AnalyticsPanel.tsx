import { useState, useCallback } from 'react';
import { ChatTerminal } from './ChatTerminal';
import { ChartWithIndicators, type ChartInterval } from './ChartWithIndicators';
import type { PriceAlert } from '../services/apiService';

type Category = 'crypto' | 'stock' | 'fx' | 'metal';

interface Asset {
  symbol: string;
  tv: string;
  label: string;
}

const ASSETS: Record<Category, Asset[]> = {
  crypto: [
    { symbol: 'BTC',  tv: 'BINANCE:BTCUSDT',  label: 'BTC/USD' },
    { symbol: 'ETH',  tv: 'BINANCE:ETHUSDT',  label: 'ETH/USD' },
    { symbol: 'SOL',  tv: 'BINANCE:SOLUSDT',  label: 'SOL/USD' },
    { symbol: 'XRP',  tv: 'BINANCE:XRPUSDT',  label: 'XRP/USD' },
    { symbol: 'BNB',  tv: 'BINANCE:BNBUSDT',  label: 'BNB/USD' },
    { symbol: 'ADA',  tv: 'BINANCE:ADAUSDT',  label: 'ADA/USD' },
    { symbol: 'DOGE', tv: 'BINANCE:DOGEUSDT', label: 'DOGE/USD' },
    { symbol: 'AVAX', tv: 'BINANCE:AVAXUSDT', label: 'AVAX/USD' },
    { symbol: 'LINK', tv: 'BINANCE:LINKUSDT', label: 'LINK/USD' },
    { symbol: 'UNI',  tv: 'BINANCE:UNIUSDT',  label: 'UNI/USD' },
    { symbol: 'ARB',  tv: 'BINANCE:ARBUSDT',  label: 'ARB/USD' },
    { symbol: 'OP',   tv: 'BINANCE:OPUSDT',   label: 'OP/USD' },
    { symbol: 'INJ',  tv: 'BINANCE:INJUSDT',  label: 'INJ/USD' },
    { symbol: 'SUI',  tv: 'BINANCE:SUIUSDT',  label: 'SUI/USD' },
    { symbol: 'TON',  tv: 'BINANCE:TONUSDT',  label: 'TON/USD' },
    { symbol: 'PEPE', tv: 'BINANCE:PEPEUSDT', label: 'PEPE/USD' },
    { symbol: 'WIF',  tv: 'BINANCE:WIFUSDT',  label: 'WIF/USD' },
    { symbol: 'AAVE', tv: 'BINANCE:AAVEUSDT', label: 'AAVE/USD' },
    { symbol: 'CRV',  tv: 'BINANCE:CRVUSDT',  label: 'CRV/USD' },
    { symbol: 'DYDX', tv: 'BINANCE:DYDXUSDT', label: 'DYDX/USD' },
  ],
  stock: [
    { symbol: 'AAPL',  tv: 'NASDAQ:AAPL',  label: 'AAPL' },
    { symbol: 'TSLA',  tv: 'NASDAQ:TSLA',  label: 'TSLA' },
    { symbol: 'NVDA',  tv: 'NASDAQ:NVDA',  label: 'NVDA' },
    { symbol: 'MSFT',  tv: 'NASDAQ:MSFT',  label: 'MSFT' },
    { symbol: 'GOOGL', tv: 'NASDAQ:GOOGL', label: 'GOOGL' },
    { symbol: 'AMZN',  tv: 'NASDAQ:AMZN',  label: 'AMZN' },
    { symbol: 'META',  tv: 'NASDAQ:META',  label: 'META' },
    { symbol: 'NFLX',  tv: 'NASDAQ:NFLX',  label: 'NFLX' },
    { symbol: 'AMD',   tv: 'NASDAQ:AMD',   label: 'AMD' },
    { symbol: 'COIN',  tv: 'NASDAQ:COIN',  label: 'COIN' },
    { symbol: 'PLTR',  tv: 'NYSE:PLTR',    label: 'PLTR' },
    { symbol: 'CRWD',  tv: 'NASDAQ:CRWD',  label: 'CRWD' },
    { symbol: 'SHOP',  tv: 'NYSE:SHOP',    label: 'SHOP' },
    { symbol: 'BABA',  tv: 'NYSE:BABA',    label: 'BABA' },
    { symbol: 'JPM',   tv: 'NYSE:JPM',     label: 'JPM' },
    { symbol: 'GS',    tv: 'NYSE:GS',      label: 'GS' },
    { symbol: 'V',     tv: 'NYSE:V',       label: 'V' },
    { symbol: 'ASML',  tv: 'NASDAQ:ASML',  label: 'ASML' },
  ],
  fx: [
    { symbol: 'EURUSD', tv: 'FX:EURUSD', label: 'EUR/USD' },
    { symbol: 'GBPUSD', tv: 'FX:GBPUSD', label: 'GBP/USD' },
    { symbol: 'USDJPY', tv: 'FX:USDJPY', label: 'USD/JPY' },
    { symbol: 'AUDUSD', tv: 'FX:AUDUSD', label: 'AUD/USD' },
    { symbol: 'USDCHF', tv: 'FX:USDCHF', label: 'USD/CHF' },
    { symbol: 'USDCAD', tv: 'FX:USDCAD', label: 'USD/CAD' },
    { symbol: 'NZDUSD', tv: 'FX:NZDUSD', label: 'NZD/USD' },
    { symbol: 'USDCNH', tv: 'FX:USDCNH', label: 'USD/CNH' },
    { symbol: 'USDBRL', tv: 'FX_IDC:USDBRL', label: 'USD/BRL' },
    { symbol: 'USDINR', tv: 'FX_IDC:USDINR', label: 'USD/INR' },
    { symbol: 'USDKRW', tv: 'FX_IDC:USDKRW', label: 'USD/KRW' },
    { symbol: 'USDMXN', tv: 'FX:USDMXN', label: 'USD/MXN' },
  ],
  metal: [
    { symbol: 'XAUUSD', tv: 'TVC:GOLD',   label: 'XAU/USD' },
    { symbol: 'XAGUSD', tv: 'TVC:SILVER', label: 'XAG/USD' },
  ],
};

const CATEGORY_LABELS: Record<Category, string> = {
  crypto: 'Crypto',
  stock: 'Stocks',
  fx: 'FX',
  metal: 'Metals',
};

interface AnalyticsPanelProps {
  onAlertCreated?: (alert: PriceAlert) => void;
  defaultEmail?: string;
  walletPublicKey?: string;
}

export function AnalyticsPanel({ onAlertCreated, defaultEmail, walletPublicKey }: AnalyticsPanelProps) {
  const [category, setCategory] = useState<Category>('crypto');
  const [activeAsset, setActiveAsset] = useState<Asset>(ASSETS.crypto[0]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    setActiveAsset(ASSETS[cat][0]);
  }, []);

  const [activeStudy, setActiveStudy] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<ChartInterval>('1d');

  const TIMEFRAMES: { value: ChartInterval; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
  ];

  const tvInterval = timeframe === '1d' ? 'D' : timeframe === '1w' ? 'W' : timeframe === '1h' ? '60' : timeframe === '4h' ? '240' : timeframe === '1m' ? '1' : timeframe === '5m' ? '5' : '15';

  const tvUrl =
    `https://s.tradingview.com/widgetembed/?` +
    `symbol=${encodeURIComponent(activeAsset.tv)}` +
    `&interval=${tvInterval}` +
    `&theme=dark` +
    `&style=1` +
    `&hideideas=1` +
    `&saveimage=0` +
    `&withdateranges=1` +
    `&hide_side_toolbar=0` +
    `&allow_symbol_change=0` +
    `&referral_id=by_nik0`;

  const toggleStudy = useCallback((studyId: string) => {
    setActiveStudy(prev => (prev === studyId ? null : studyId));
  }, []);

  const TA_METRICS = [
    { id: 'RSI', name: 'RSI', desc: 'Relative Strength Index' },
    { id: 'MACD', name: 'MACD', desc: 'Moving Average Convergence Divergence' },
    { id: 'Bollinger Bands', name: 'Bollinger Bands', desc: 'Volatility bands' },
    { id: 'Moving Average', name: 'MA', desc: 'Moving Average' },
    { id: 'Stochastic', name: 'Stochastic', desc: 'Stochastic Oscillator' },
    { id: 'ATR', name: 'ATR', desc: 'Average True Range' },
    { id: 'OBV', name: 'OBV', desc: 'On-Balance Volume' },
    { id: 'ADX', name: 'ADX', desc: 'Average Directional Index' },
    { id: 'CCI', name: 'CCI', desc: 'Commodity Channel Index' },
    { id: 'WilliamsR', name: 'Williams %R', desc: 'Williams Percent Range' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chart + metrics area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Asset selector — fixed top row, no overlap */}
        <div className="shrink-0 flex flex-col gap-2 p-3 pb-2 bg-[#0d1117] border-b border-gray-800">
          <div className="flex gap-1" style={{ maxWidth: '420px' }}>
            <div className="flex gap-1 bg-[#0d1117]/90 backdrop-blur border border-gray-700/60 rounded-xl p-1 shadow-xl">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  data-testid={`analytics-cat-${cat}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    category === cat
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide max-w-full" style={{ maxWidth: 'min(100%, 520px)' }}>
            <div className="flex gap-1.5 bg-[#0d1117]/85 backdrop-blur border border-gray-700/60 rounded-xl px-2 py-1.5 shadow-xl">
              {ASSETS[category].map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => setActiveAsset(asset)}
                  data-testid={`analytics-asset-${asset.symbol}`}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 border ${
                    activeAsset.symbol === asset.symbol
                      ? 'bg-purple-600/30 border-purple-500/60 text-purple-300'
                      : 'border-gray-700/40 text-gray-400 hover:text-gray-200 hover:border-gray-600/60 hover:bg-gray-800/50'
                  }`}
                >
                  {asset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-gray-800 bg-[#0d1117]/80">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mr-1">Таймфрейм</span>
          {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === value
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50'
                  : 'border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart + right metrics panel */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            {activeAsset.tv.startsWith('BINANCE:') ? (
              <ChartWithIndicators
                tvSymbol={activeAsset.tv}
                activeStudy={activeStudy}
                interval={timeframe}
                className="w-full h-full min-h-0"
              />
            ) : (
              <iframe
                key={activeAsset.tv}
                src={tvUrl}
                title={`${activeAsset.label} Chart`}
                className="w-full h-full border-0 min-h-0"
                allow="fullscreen"
                data-testid="tradingview-chart"
              />
            )}
          </div>
          {/* 10 TA metrics — bottom-right panel */}
          <div
            className="shrink-0 w-52 flex flex-col border-l border-gray-800 bg-[#0d1117]/95 backdrop-blur overflow-hidden"
            style={{ minWidth: '200px' }}
          >
            <div className="shrink-0 px-3 py-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-purple-400 tracking-widest uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Technical analysis
              </span>
              <p className="text-[10px] text-gray-500 mt-1">Click to overlay on chart (crypto)</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {TA_METRICS.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleStudy(m.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-all duration-150 ${
                    activeStudy === m.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50'
                  }`}
                >
                  <span className="font-mono font-semibold">{m.name}</span>
                  <span className="block text-[10px] text-gray-500 mt-0.5 truncate">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slim chat panel — right column */}
      <div
        className="flex flex-col border-l border-gray-800 bg-[#0d1117]"
        style={{ width: '300px', minWidth: '300px' }}
      >
        {/* Panel header */}
        <div className="h-9 flex items-center px-3 border-b border-gray-800 shrink-0">
          <span
            className="text-xs font-semibold text-purple-400 tracking-widest uppercase"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            AI Chat
          </span>
          <div className="ml-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        </div>

        <ChatTerminal
          compact
          onAlertCreated={onAlertCreated}
          defaultEmail={defaultEmail}
          walletPublicKey={walletPublicKey}
        />
      </div>
    </div>
  );
}
