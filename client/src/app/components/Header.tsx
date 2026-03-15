import { Wallet, Circle } from 'lucide-react';
import { Button } from './ui/button';
import logoImage from 'figma:asset/04cc8725de0b5f07a5783785b96083eab87cf4b3.png';
import { useState, useEffect } from 'react';

export function Header() {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_COINMARKETCAP_API_KEY;
    setHasApiKey(!!apiKey && apiKey.trim() !== '');
  }, []);

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0d1117] flex items-center px-6 justify-between">
      {/* Left - Logo */}
      <div className="flex items-center gap-2">
        <h1 
          className="text-3xl tracking-wider" 
          style={{ fontFamily: 'Orbitron, sans-serif', color: '#a78bfa', textShadow: '0 0 20px rgba(167, 139, 250, 0.5)' }}
        >
          By Nik0
        </h1>
        <img 
          src={logoImage} 
          alt="By Nik0 Logo"
          className="h-10 w-10 object-contain"
          style={{
            filter: 'brightness(0) saturate(100%) invert(79%) sepia(18%) saturate(1654%) hue-rotate(205deg) brightness(101%) contrast(98%)',
            dropShadow: '0 0 20px rgba(167, 139, 250, 0.5)',
          }}
        />
      </div>

      {/* Center - Status bars */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <Circle className={`w-2 h-2 ${hasApiKey ? 'fill-green-400 text-green-400' : 'fill-purple-400 text-purple-400 animate-pulse'}`} />
          <span className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            CoinMarketCap: {hasApiKey ? (
              <span className="text-green-400">Connected</span>
            ) : (
              <span className="text-purple-400">SOON</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <Circle className="w-2 h-2 fill-blue-400 text-blue-400" />
          <span className="text-sm text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            MCP Bridge: <span className="text-blue-400">Active</span>
          </span>
        </div>
      </div>

      {/* Right - Wallet and Network */}
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <span className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Network: <span className="text-purple-400">Solana</span>
          </span>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </div>
    </header>
  );
}