import { motion } from 'motion/react';
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Repeat, Activity } from 'lucide-react';
import { Button } from './ui/button';

// Volatility Card Component
export function VolatilityCard({ data }: { data: any }) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' };
      case 'Medium': return { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', text: '#eab308' };
      case 'High': return { bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316', text: '#f97316' };
      case 'Extreme': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280' };
    }
  };

  const colors = getRiskColor(data.risk);

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 border-2 rounded-lg p-4"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.asset} Volatility Analysis
          </div>
          <div className="flex items-baseline gap-3">
            <span 
              className="text-3xl font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: colors.text }}
            >
              {data.volatility}%
            </span>
            <span className="text-sm text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Std Dev: ±{data.stdDev}
            </span>
          </div>
        </div>
        <div 
          className="px-3 py-1 rounded-full font-bold text-sm"
          style={{ backgroundColor: colors.bg, color: colors.text, border: `2px solid ${colors.border}` }}
        >
          {data.risk} Risk
        </div>
      </div>
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Activity className="w-4 h-4 mt-0.5" style={{ color: colors.text }} />
          <p className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.recommendation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Confidence Card Component
export function ConfidenceCard({ data }: { data: any }) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return '#22c55e';
      case 'Good': return '#3b82f6';
      case 'Fair': return '#eab308';
      case 'Poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const color = getQualityColor(data.quality);

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-lg p-4"
    >
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          Pyth Oracle Confidence Score
        </div>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-2xl font-bold text-blue-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ${data.price.toFixed(2)}
          </span>
          <span className="text-sm" style={{ fontFamily: 'JetBrains Mono, monospace', color }}>
            ±{data.confidence}% ({data.quality})
          </span>
        </div>
        <div className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Range: ${data.confidenceRange.min} - ${data.confidenceRange.max}
        </div>
      </div>
      
      {/* Confidence Bar */}
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${100 - data.confidence * 10}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {data.warning && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-200" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.warning}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// Correlation Card Component
export function CorrelationCard({ data }: { data: any }) {
  const getCorrelationColor = (corr: number) => {
    if (corr > 0.5) return '#22c55e';
    if (corr < -0.5) return '#ef4444';
    return '#3b82f6';
  };

  const color = getCorrelationColor(data.correlation);
  const Icon1 = data.trend1 === 'up' ? TrendingUp : data.trend1 === 'down' ? TrendingDown : Activity;
  const Icon2 = data.trend2 === 'up' ? TrendingUp : data.trend2 === 'down' ? TrendingDown : Activity;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 border-2 border-purple-500/30 rounded-lg p-4 bg-purple-500/5"
    >
      <div className="text-sm text-gray-400 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
        Cross-Asset Correlation Analysis
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.asset1}
            </div>
            <Icon1 className="w-5 h-5 mx-auto mt-1" style={{ color: data.trend1 === 'up' ? '#22c55e' : data.trend1 === 'down' ? '#ef4444' : '#6b7280' }} />
          </div>
        </div>

        <div className="flex flex-col items-center px-6">
          <div 
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'JetBrains Mono, monospace', color }}
          >
            {data.correlation > 0 ? '+' : ''}{data.correlation}
          </div>
          <div className="text-xs text-gray-500">Correlation</div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.asset2}
            </div>
            <Icon2 className="w-5 h-5 mx-auto mt-1" style={{ color: data.trend2 === 'up' ? '#22c55e' : data.trend2 === 'down' ? '#ef4444' : '#6b7280' }} />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <p className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
          {data.analysis}
        </p>
      </div>
    </motion.div>
  );
}

// Swap Preview Card Component
export function SwapCard({ data }: { data: any }) {
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30 rounded-lg p-4"
    >
      <div className="text-sm text-gray-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        Smart Swap Preview (Jupiter Aggregator)
      </div>
      
      <div className="space-y-3">
        {/* From */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">You Pay</div>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.from.amount} {data.from.asset}
            </span>
            <span className="text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${data.from.usdValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="bg-blue-500/20 p-2 rounded-full">
            <Repeat className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* To */}
        <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">You Receive</div>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.to.amount} {data.to.asset}
            </span>
            <span className="text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${data.to.usdValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
          <div>
            <div className="text-xs text-gray-500 mb-1">Rate</div>
            <div className="text-sm font-bold text-blue-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.rate}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Slippage</div>
            <div className="text-sm font-bold text-yellow-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {data.slippage}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Fees</div>
            <div className="text-sm font-bold text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${data.fees}
            </div>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 font-bold"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Approve Transaction
        </Button>
      </div>
    </motion.div>
  );
}

// Limit Order Card Component
export function LimitOrderCard({ data }: { data: any }) {
  const progress = Math.min(100, Math.max(0, data.progress));
  const isTriggered = data.status === 'triggered';

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg p-4"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Limit {data.type.toUpperCase()} Order
          </div>
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {data.asset} @ ${data.targetPrice}
          </div>
        </div>
        <div 
          className={`px-3 py-1 rounded-full font-bold text-xs ${
            isTriggered ? 'bg-green-500/20 text-green-400 border-2 border-green-500' : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
          }`}
        >
          {isTriggered ? '✓ TRIGGERED' : 'ACTIVE'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-500 mb-1">Target Price</div>
            <div className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${data.targetPrice}
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-500 mb-1">Current Price</div>
            <div className="text-lg font-bold text-blue-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ${data.currentPrice.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-400 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          Monitoring Pyth Network price feed...
        </div>
      </div>
    </motion.div>
  );
}

// Risk Assessment Card Component
export function RiskCard({ data }: { data: any }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Safe': return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' };
      case 'Moderate': return { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', text: '#eab308' };
      case 'High': return { bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316', text: '#f97316' };
      case 'Critical': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280' };
    }
  };

  const colors = getRiskColor(data.riskLevel);

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 border-2 rounded-lg p-4"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5" style={{ color: colors.text }} />
        <span className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: colors.text }}>
          Risk Manager Analysis
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Portfolio Value</div>
          <div className="text-xl font-bold text-blue-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ${data.portfolioValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Trade Value</div>
          <div className="text-xl font-bold text-purple-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ${data.tradeValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Impact Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Portfolio Impact</span>
          <span style={{ color: colors.text }} className="font-bold">
            {data.portfolioImpact.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, data.portfolioImpact)}%`, backgroundColor: colors.border }}
          />
        </div>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.warnings.map((warning: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 text-sm" style={{ color: colors.text }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span style={{ fontFamily: 'Inter, sans-serif' }}>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gray-900/70 border-2 rounded-lg p-3" style={{ borderColor: colors.border }}>
        <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif', color: colors.text }}>
          Recommendation:
        </div>
        <p className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
          {data.recommendation}
        </p>
      </div>
    </motion.div>
  );
}
