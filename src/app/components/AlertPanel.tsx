import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PriceAlert } from '../services/apiService';

interface AlertPanelProps {
  alerts: PriceAlert[];
  onDelete: (id: string) => void;
}

export function AlertPanel({ alerts, onDelete }: AlertPanelProps) {
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const recentTriggered = alerts.filter(a => a.status === 'triggered').slice(0, 3);

  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center">
        <BellOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          No active alerts
        </p>
        <p className="text-xs text-gray-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Ask AI to set a price alert
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {activeAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-gray-900/60 border border-purple-500/30 rounded-lg p-3 hover:border-purple-500/60 transition-all"
            data-testid={`alert-card-${alert.id}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {alert.condition === 'above' ? (
                  <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <span
                    className="text-xs font-bold text-white"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {alert.symbol}/USD
                  </span>
                  <span className="text-xs text-gray-400 ml-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {alert.condition === 'above' ? '>' : '<'} ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: alert.targetPrice < 10 ? 4 : 2 })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDelete(alert.id)}
                className="text-gray-600 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                data-testid={`delete-alert-${alert.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="mb-1.5">
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${alert.condition === 'above' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, alert.progress)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Now: ${alert.currentPrice > 0 ? alert.currentPrice.toLocaleString(undefined, { maximumFractionDigits: alert.currentPrice < 10 ? 4 : 2 }) : '...'}
              </span>
              <span className="text-xs text-purple-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {Math.min(100, Math.round(alert.progress))}%
              </span>
            </div>

            {alert.email && (
              <div className="mt-1.5 flex items-center gap-1">
                <Bell className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-400 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {alert.email}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {recentTriggered.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2 px-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Recently triggered
          </p>
          {recentTriggered.map(alert => (
            <div
              key={alert.id}
              className="bg-gray-900/30 border border-green-500/20 rounded-lg p-2 mb-1.5 opacity-60"
              data-testid={`triggered-alert-${alert.id}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span className="text-xs text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {alert.symbol} {alert.condition === 'above' ? '>' : '<'} ${alert.targetPrice.toLocaleString()} ✓
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
