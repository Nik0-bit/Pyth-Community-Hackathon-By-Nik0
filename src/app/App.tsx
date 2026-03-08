import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ChatTerminal } from './components/ChatTerminal';
import { api, type PriceAlert } from './services/apiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';

declare global {
  interface Window {
    solana?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      isPhantom?: boolean;
    };
  }
}

export default function App() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resendKey, setResendKey] = useState('');
  const [defaultEmail, setDefaultEmail] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('akiro_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) setDefaultEmail(parsed.email);
        if (parsed.resendKey) setResendKey(parsed.resendKey);
      } catch {}
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const result = await api.getAlerts();
      if (result.success) setAlerts(result.alerts);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleDeleteAlert = useCallback(async (id: string) => {
    try {
      await api.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  }, []);

  const handleNewAlert = useCallback((alert: PriceAlert) => {
    setAlerts(prev => {
      if (prev.some(a => a.id === alert.id)) return prev;
      return [alert, ...prev];
    });
  }, []);

  const handleConnectWallet = useCallback(async () => {
    if (walletAddress) {
      try {
        await window.solana?.disconnect();
        setWalletAddress(undefined);
      } catch {}
      return;
    }
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      const resp = await window.solana.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch (err) {
      console.error('Wallet connect failed:', err);
    }
  }, [walletAddress]);

  const handleQuickAlert = useCallback(async (symbol: string, condition: 'above' | 'below', targetPrice: number) => {
    const email = defaultEmail || '';
    try {
      const result = await api.createAlert({ symbol, condition, targetPrice, email });
      if (result.success) handleNewAlert(result.alert);
    } catch (err) {
      console.error('Quick alert failed:', err);
    }
  }, [defaultEmail, handleNewAlert]);

  const saveSettings = () => {
    localStorage.setItem('akiro_settings', JSON.stringify({ email: defaultEmail, resendKey }));
    setSettingsOpen(false);
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        alertCount={activeAlerts.length}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar
          alerts={alerts}
          onDeleteAlert={handleDeleteAlert}
          walletAddress={walletAddress}
        />
        <ChatTerminal
          onAlertCreated={handleNewAlert}
          defaultEmail={defaultEmail}
        />
        <RightSidebar onQuickAlert={handleQuickAlert} />
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#0d1117] border border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              ⚙️ Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-gray-400 block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Default Email for Alerts
              </label>
              <input
                type="email"
                value={defaultEmail}
                onChange={e => setDefaultEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Resend API Key (for email notifications)
              </label>
              <input
                type="password"
                value={resendKey}
                onChange={e => setResendKey(e.target.value)}
                placeholder="re_..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                data-testid="input-resend-key"
              />
              <p className="text-xs text-gray-600 mt-1">
                Get a free key at resend.com (3,000 emails/month free)
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveSettings}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition-colors"
                data-testid="save-settings"
              >
                Save
              </button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
