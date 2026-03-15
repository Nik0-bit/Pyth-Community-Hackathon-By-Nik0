import { Wallet, Circle, Bell, Settings, BarChart2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface HeaderProps {
  alertCount: number;
  walletAddress?: string;
  onConnectWallet: () => void;
  onOpenSettings: () => void;
  mode: 'chat' | 'analytics';
  onModeToggle: () => void;
}

export function Header({ alertCount, walletAddress, onConnectWallet, onOpenSettings, mode, onModeToggle }: HeaderProps) {
  const [pythStatus, setPythStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  useEffect(() => {
    api.getHealth().then(h => {
      setPythStatus('live');
      setGeminiStatus(h.gemini ? 'active' : 'inactive');
    }).catch(() => {
      setPythStatus('error');
      setGeminiStatus('inactive');
    });
  }, []);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0d1117] flex items-center px-6 justify-between">
      <div className="flex items-center gap-3">
        <h1
          className="text-3xl tracking-wider"
          style={{ fontFamily: 'Orbitron, sans-serif', color: '#a78bfa', textShadow: '0 0 20px rgba(167, 139, 250, 0.5)' }}
        >
          By Nik0
        </h1>
        <div
          className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-900/50 border border-purple-500/50"
          style={{ boxShadow: '0 0 20px rgba(167, 139, 250, 0.5)' }}
        >
          <span className="text-xl font-bold text-purple-300">A</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800" data-testid="pyth-status">
          <Circle className={`w-2 h-2 ${pythStatus === 'live' ? 'fill-green-400 text-green-400' : pythStatus === 'error' ? 'fill-red-400 text-red-400' : 'fill-yellow-400 text-yellow-400 animate-pulse'}`} />
          <span className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            Pyth Network:{' '}
            {pythStatus === 'live' && <span className="text-green-400">Live</span>}
            {pythStatus === 'error' && <span className="text-red-400">Error</span>}
            {pythStatus === 'connecting' && <span className="text-yellow-400 animate-pulse">Connecting</span>}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800" data-testid="gemini-status">
          <Circle className={`w-2 h-2 ${geminiStatus === 'active' ? 'fill-blue-400 text-blue-400' : 'fill-gray-500 text-gray-500'}`} />
          <span className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gemini AI:{' '}
            {geminiStatus === 'active' && <span className="text-blue-400">Active</span>}
            {geminiStatus === 'inactive' && <span className="text-gray-500">Setup needed</span>}
            {geminiStatus === 'checking' && <span className="text-gray-400 animate-pulse">Checking</span>}
          </span>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 rounded-lg border border-purple-500/40" data-testid="alert-count">
            <Bell className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm text-purple-400 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {alertCount} alert{alertCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <button
          onClick={onModeToggle}
          data-testid="mode-toggle-button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-300 ${
            mode === 'analytics'
              ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50 hover:shadow-lg hover:shadow-cyan-500/20'
              : 'bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-900/50 hover:shadow-lg hover:shadow-purple-500/20'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {mode === 'analytics' ? (
            <>
              <MessageSquare className="w-4 h-4" />
              Chat Mode
            </>
          ) : (
            <>
              <BarChart2 className="w-4 h-4" />
              Analytic Mode
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <span className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Network: <span className="text-purple-400">Solana</span>
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all"
          title="Settings"
          data-testid="settings-button"
        >
          <Settings className="w-4 h-4" />
        </button>

        <Button
          onClick={onConnectWallet}
          className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          style={{ fontFamily: 'Inter, sans-serif' }}
          data-testid="connect-wallet-button"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {shortAddress ? shortAddress : 'Connect Wallet'}
        </Button>
      </div>
    </header>
  );
}
