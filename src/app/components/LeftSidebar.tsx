import { Bell, ArrowUpRight } from 'lucide-react';
import { AlertPanel } from './AlertPanel';
import type { PriceAlert } from '../services/apiService';

interface Trade {
  action: string;
  token: string;
  amount: string;
  time: string;
  success: boolean;
}

const recentTrades: Trade[] = [
  { action: 'Price Check', token: 'BTC/USD', amount: 'Pyth Oracle', time: 'live', success: true },
  { action: 'Price Check', token: 'SOL/USD', amount: 'Pyth Oracle', time: 'live', success: true },
  { action: 'Volatility', token: 'ETH/USD', amount: 'Confidence: ±0.05%', time: 'live', success: true },
];

interface LeftSidebarProps {
  alerts: PriceAlert[];
  onDeleteAlert: (id: string) => void;
  walletAddress?: string;
}

export function LeftSidebar({ alerts, onDeleteAlert, walletAddress }: LeftSidebarProps) {
  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="w-80 bg-[#0d1117] border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h2
          className="text-lg mb-4 tracking-wide"
          style={{ fontFamily: 'Inter, sans-serif', color: '#a78bfa' }}
        >
          MY WALLET
        </h2>
        {walletAddress ? (
          <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Connected</div>
            <div className="text-sm font-bold text-purple-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </div>
            <div className="text-xs text-green-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              ● Solana Mainnet
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              Connect Phantom wallet to view balances
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-b border-gray-800">
        <h2
          className="text-lg mb-4 tracking-wide"
          style={{ fontFamily: 'Inter, sans-serif', color: '#3b82f6' }}
        >
          RECENT ACTIVITY
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
                  {trade.amount}
                </span>
                <span className="text-xs text-green-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {trade.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-purple-400" />
          <h2
            className="text-lg tracking-wide"
            style={{ fontFamily: 'Inter, sans-serif', color: '#a78bfa' }}
          >
            PRICE ALERTS
          </h2>
          {activeAlerts.length > 0 && (
            <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {activeAlerts.length}
            </span>
          )}
        </div>
        <AlertPanel alerts={alerts} onDelete={onDeleteAlert} />
      </div>
    </div>
  );
}
