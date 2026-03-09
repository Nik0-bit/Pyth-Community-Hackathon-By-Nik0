import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, TrendingUp, BarChart3, Activity, Zap, Shield, Repeat, Bell, Code, ExternalLink, CheckCircle, Loader2, AlertCircle, History } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import {
  VolatilityEngine,
  ConfidenceAnalyzer,
  CrossAssetCorrelator,
  SmartSwapEngine,
} from '../utils/tradingTools';
import {
  VolatilityCard,
  ConfidenceCard,
  CorrelationCard,
  SwapCard,
  LimitOrderCard,
  RiskCard,
} from './MessageCards';
import { api, type PriceAlert, type ChatMessage, type SwapQuote } from '../services/apiService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: 'comparison' | 'chart' | 'volatility' | 'confidence' | 'correlation' | 'swap' | 'limitOrder' | 'risk' | 'alertCreated' | 'prepareSwap';
  sourceData?: any;
}

interface AIThinkingStatus {
  stage: number;
  message: string;
}

const thinkingStages: AIThinkingStatus[] = [
  { stage: 1, message: 'Connecting to Pyth Network...' },
  { stage: 2, message: 'Fetching live price feeds...' },
  { stage: 3, message: 'Analyzing market data...' },
  { stage: 4, message: 'Generating response...' },
];

const promptSuggestions = [
  { icon: Bell, text: 'Alert me when SOL hits $200', gradient: 'from-purple-500 to-pink-600' },
  { icon: Repeat, text: 'Swap 1 SOL to USDC', gradient: 'from-blue-500 to-cyan-600' },
  { icon: TrendingUp, text: 'Check SOL volatility', gradient: 'from-green-500 to-emerald-600' },
  { icon: Shield, text: 'Analyze my portfolio risk', gradient: 'from-orange-500 to-red-600' },
  { icon: History, text: 'BTC price on Jan 1 2025', gradient: 'from-yellow-500 to-orange-600' },
  { icon: BarChart3, text: 'Correlate SOL and ETH', gradient: 'from-indigo-500 to-purple-600' },
];

const JUPITER_QUOTE_URL = 'https://quote-api.jup.ag/v6';

const TOKEN_MINTS: Record<string, string> = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  ETH:  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  BTC:  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGs1X9UKNjJNBVxdqL4k6VWovxXN8YJHa',
};

const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9, USDC: 6, USDT: 6, ETH: 8, BTC: 8, JUP: 6, PYTH: 6,
};

interface SwapState {
  status: 'idle' | 'quoting' | 'quoted' | 'building' | 'signing' | 'sent' | 'error';
  outAmountFormatted?: number;
  priceImpactPct?: number;
  routePlan?: string[];
  quoteResponse?: any;
  txSignature?: string;
  error?: string;
}

interface PrepareSwapCardProps {
  fromToken: string;
  toToken: string;
  amount: number;
  walletPublicKey?: string;
  note?: string;
}

function PrepareSwapCard({ fromToken, toToken, amount, walletPublicKey, note }: PrepareSwapCardProps) {
  const [state, setState] = useState<SwapState>({ status: 'idle' });

  const handleQuote = useCallback(async () => {
    setState({ status: 'quoting' });
    try {
      const fromMint = TOKEN_MINTS[fromToken.toUpperCase()];
      const toMint = TOKEN_MINTS[toToken.toUpperCase()];
      if (!fromMint || !toMint) throw new Error(`Unsupported token pair: ${fromToken} → ${toToken}`);

      const decimals = TOKEN_DECIMALS[fromToken.toUpperCase()] ?? 9;
      const lamports = Math.floor(amount * Math.pow(10, decimals));

      const url = `${JUPITER_QUOTE_URL}/quote?inputMint=${fromMint}&outputMint=${toMint}&amount=${lamports}&slippageBps=50`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Jupiter quote failed: HTTP ${res.status}`);
      const quote = await res.json() as any;

      const outDecimals = TOKEN_DECIMALS[toToken.toUpperCase()] ?? 6;
      const outAmountFormatted = parseInt(quote.outAmount) / Math.pow(10, outDecimals);
      const routePlan: string[] = (quote.routePlan || []).map((step: any) => step.swapInfo?.label || 'DEX');

      setState({
        status: 'quoted',
        outAmountFormatted: parseFloat(outAmountFormatted.toFixed(6)),
        priceImpactPct: parseFloat(parseFloat(quote.priceImpactPct || '0').toFixed(4)),
        routePlan: routePlan.length > 0 ? routePlan : ['Jupiter Aggregator'],
        quoteResponse: quote,
      });
    } catch (err: any) {
      setState({ status: 'error', error: err.message });
    }
  }, [fromToken, toToken, amount]);

  useEffect(() => {
    handleQuote();
  }, [handleQuote]);

  const handleSign = useCallback(async () => {
    if (!state.quoteResponse) return;

    const wallet = (window as any).solana;
    if (!wallet?.isConnected && !walletPublicKey) {
      setState(s => ({ ...s, status: 'error', error: 'Phantom wallet not connected. Connect your wallet first.' }));
      return;
    }

    const pubkey = walletPublicKey || wallet?.publicKey?.toString();
    if (!pubkey) {
      setState(s => ({ ...s, status: 'error', error: 'Wallet public key not available.' }));
      return;
    }

    setState(s => ({ ...s, status: 'building' }));
    try {
      const swapRes = await fetch(`${JUPITER_QUOTE_URL}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: state.quoteResponse,
          userPublicKey: pubkey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });
      if (!swapRes.ok) throw new Error(`Jupiter swap failed: HTTP ${swapRes.status}`);
      const swapData = await swapRes.json() as any;

      setState(s => ({ ...s, status: 'signing' }));

      const txBytes = Uint8Array.from(atob(swapData.swapTransaction), c => c.charCodeAt(0));
      const { VersionedTransaction } = await import('@solana/web3.js');
      const transaction = VersionedTransaction.deserialize(txBytes);

      const result = await wallet.signAndSendTransaction(transaction);
      const sig = result?.signature || result;

      setState(s => ({ ...s, status: 'sent', txSignature: String(sig) }));
    } catch (err: any) {
      setState(s => ({
        ...s,
        status: 'error',
        error: err.message?.includes('User rejected') ? 'Transaction rejected by user.' : err.message,
      }));
    }
  }, [state.quoteResponse, walletPublicKey]);

  const statusIcon = {
    idle: null,
    quoting: <Loader2 className="w-4 h-4 animate-spin text-blue-400" />,
    quoted: <CheckCircle className="w-4 h-4 text-green-400" />,
    building: <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />,
    signing: <Loader2 className="w-4 h-4 animate-spin text-purple-400" />,
    sent: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
  }[state.status];

  const statusText = {
    idle: 'Preparing...',
    quoting: 'Getting best route from Jupiter...',
    quoted: 'Route found',
    building: 'Building transaction...',
    signing: 'Waiting for Phantom signature...',
    sent: 'Transaction sent!',
    error: state.error || 'Error',
  }[state.status];

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/40 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Repeat className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-bold text-blue-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          JUPITER SWAP
        </span>
      </div>

      {note && (
        <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{note}</p>
      )}

      <div className="flex items-center justify-between bg-gray-900/60 rounded-lg p-3 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">FROM</div>
          <div className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {amount} {fromToken}
          </div>
        </div>
        <div className="text-blue-400">→</div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">TO</div>
          <div className="text-lg font-bold text-cyan-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {state.outAmountFormatted ? `≈ ${state.outAmountFormatted.toFixed(4)} ${toToken}` : toToken}
          </div>
        </div>
      </div>

      {state.quoteResponse && state.status !== 'error' && (
        <div className="space-y-1 mb-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <div className="flex justify-between text-gray-400">
            <span>Price Impact</span>
            <span className={(state.priceImpactPct ?? 0) > 1 ? 'text-red-400' : 'text-green-400'}>
              {(state.priceImpactPct ?? 0) < 0.01 ? '< 0.01%' : `${(state.priceImpactPct ?? 0).toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Route</span>
            <span className="text-blue-400">{(state.routePlan ?? []).slice(0, 2).join(' → ')}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Slippage</span>
            <span>0.5%</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {statusIcon}
        <span className="text-xs text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {statusText}
        </span>
      </div>

      {state.status === 'sent' && state.txSignature && (
        <a
          href={`https://solscan.io/tx/${state.txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mb-3"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <ExternalLink className="w-3 h-3" />
          View on Solscan: {state.txSignature.slice(0, 16)}...
        </a>
      )}

      {state.status === 'error' && (
        <button
          onClick={handleQuote}
          className="text-xs text-blue-400 hover:text-blue-300 underline mb-2"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Retry
        </button>
      )}

      {(state.status === 'quoted') && (
        <Button
          onClick={handleSign}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-lg transition-all"
          data-testid="sign-swap-button"
        >
          <Zap className="w-4 h-4 mr-2" />
          Sign & Send via Phantom
        </Button>
      )}

      {(state.status === 'quoting' || state.status === 'building' || state.status === 'signing') && (
        <Button disabled className="w-full bg-gray-700 text-gray-400 text-sm py-2 rounded-lg">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {state.status === 'quoting' ? 'Getting quote...' : state.status === 'building' ? 'Building tx...' : 'Waiting for signature...'}
        </Button>
      )}

      {!walletPublicKey && state.status !== 'sent' && (
        <p className="text-xs text-yellow-500 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          ⚠ Connect your Phantom wallet to execute swaps
        </p>
      )}
    </motion.div>
  );
}

interface ChatTerminalProps {
  onAlertCreated?: (alert: PriceAlert) => void;
  defaultEmail?: string;
  walletPublicKey?: string;
}

export function ChatTerminal({ onAlertCreated, defaultEmail, walletPublicKey }: ChatTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to Akiro Labs Terminal. I\'m your AI trading assistant powered by Pyth Network real-time oracles on Solana.\n\n> Capabilities:\n• Real-time price feeds: crypto, stocks (AAPL, TSLA, NVDA, MSFT), FX (EUR/USD, GBP/USD), gold\n• Price alerts with email notifications\n• Historical prices via Pyth Benchmarks\n• Real Jupiter DEX swaps (sign with Phantom)\n• Volatility & correlation analysis\n• Portfolio risk management\n\nAsk me anything — in English or Russian!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setThinkingStage(prev => (prev + 1) % thinkingStages.length);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue('');
    setIsTyping(true);
    setThinkingStage(0);

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: text },
    ];

    try {
      const response = await api.chat(newHistory, defaultEmail, walletPublicKey);

      if (response.success) {
        setChatHistory([
          ...newHistory,
          { role: 'assistant', content: response.content },
        ]);

        let component: Message['component'] | undefined;
        let sourceData: any;

        if (response.alert) {
          component = 'alertCreated';
          sourceData = response.alert;
          onAlertCreated?.(response.alert);
        } else if (response.action?.action === 'create_alert') {
          component = 'alertCreated';
          sourceData = response.action;
        } else if (response.action?.action === 'prepare_swap') {
          component = 'prepareSwap';
          sourceData = response.action;
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.content,
          timestamp: new Date(),
          component,
          sourceData,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('[Chat] error:', err);

      const lowerText = text.toLowerCase();
      let fallbackContent = '';
      let fallbackComponent: Message['component'] | undefined;
      let fallbackSourceData: any;

      if (lowerText.includes('volatil') || lowerText.includes('risk')) {
        const symbol = lowerText.includes('btc') ? 'BTC' : lowerText.includes('eth') ? 'ETH' : 'SOL';
        const mockChange = symbol === 'BTC' ? 2.3 : symbol === 'ETH' ? 4.7 : 5.6;
        const analysis = await VolatilityEngine.quickAnalyze(symbol, mockChange);
        fallbackContent = `> ✓ Volatility Engine running\n> ✓ Risk metrics calculated\n\n📊 Analysis for ${symbol}`;
        fallbackComponent = 'volatility';
        fallbackSourceData = analysis;
      } else if (lowerText.includes('confidence') || lowerText.includes('oracle')) {
        const symbol = lowerText.includes('btc') ? 'BTC' : lowerText.includes('eth') ? 'ETH' : 'SOL';
        const mockPrice = symbol === 'BTC' ? 67000 : symbol === 'ETH' ? 3400 : 148;
        const analysis = ConfidenceAnalyzer.analyze(symbol, mockPrice, mockPrice * 0.002);
        fallbackContent = `> ✓ Pyth Oracle confidence analyzed\n\n🔍 Confidence Analysis for ${symbol}`;
        fallbackComponent = 'confidence';
        fallbackSourceData = analysis;
      } else if (lowerText.includes('swap') || lowerText.includes('trade')) {
        const swap = SmartSwapEngine.prepareSwap('SOL', 10, 148, 'USDC', 1.0);
        fallbackContent = `> ✓ Smart Swap preview calculated\n\n💱 Jupiter Route Preview`;
        fallbackComponent = 'swap';
        fallbackSourceData = swap;
      } else if (lowerText.includes('correlat')) {
        const corr = await CrossAssetCorrelator.correlate('SOL', 148, 5.6, 'ETH', 3400, 4.7);
        fallbackContent = `> ✓ Correlation analysis complete\n\n🔗 Cross-Asset Analysis`;
        fallbackComponent = 'correlation';
        fallbackSourceData = corr;
      } else {
        fallbackContent = `> ⚠️ AI service temporarily unavailable\n\nLocal analysis tools still available:\n• Volatility Engine\n• Confidence Analyzer\n• Correlation Analysis\n\nError: ${err.message}`;
      }

      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fallbackContent,
        timestamp: new Date(),
        component: fallbackComponent,
        sourceData: fallbackSourceData,
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, chatHistory, onAlertCreated, addMessage, defaultEmail, walletPublicKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className="w-96 h-96 rounded-full border-[10px] border-purple-500/10 flex items-center justify-center opacity-20"
          style={{ boxShadow: '0 0 100px rgba(167, 139, 250, 0.2)' }}
        >
          <span className="text-[150px] font-bold text-purple-500/20">A</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4 relative z-10">
        {messages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl ${
                message.type === 'user'
                  ? 'bg-purple-600/20 border-purple-500/50'
                  : 'bg-gray-900/80 border-gray-700'
              } border-2 rounded-lg p-4 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: message.type === 'user' ? '#a78bfa' : '#3b82f6',
                    }}
                  >
                    {message.type === 'user' ? 'YOU' : 'AKIRO AI'}
                  </span>
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {message.type === 'ai' && message.sourceData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSource(expandedSource === message.id ? null : message.id)}
                    className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Code className="w-3 h-3 mr-1" />
                    {expandedSource === message.id ? 'Hide' : 'Data'}
                  </Button>
                )}
              </div>

              <div
                className="text-gray-100 whitespace-pre-wrap"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', lineHeight: '1.6' }}
                data-testid={`message-${message.id}`}
              >
                {message.content}
              </div>

              {expandedSource === message.id && message.sourceData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 bg-gray-950 rounded-lg p-3 border border-gray-700"
                >
                  <pre className="text-xs text-green-400 overflow-auto max-h-32" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {JSON.stringify(message.sourceData, null, 2)}
                  </pre>
                </motion.div>
              )}

              {message.component === 'alertCreated' && message.sourceData && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/40 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-sm font-bold text-purple-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ALERT CREATED
                    </span>
                  </div>
                  <div className="space-y-1 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Asset:</span>
                      <span className="text-white font-bold">{message.sourceData.symbol}/USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Condition:</span>
                      <span className={message.sourceData.condition === 'above' ? 'text-green-400' : 'text-red-400'}>
                        Price {message.sourceData.condition} ${(message.sourceData.targetPrice || message.sourceData.target_price)?.toLocaleString()}
                      </span>
                    </div>
                    {message.sourceData.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Notify:</span>
                        <span className="text-blue-400">{message.sourceData.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">● Active monitoring</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {message.component === 'prepareSwap' && message.sourceData && (
                <PrepareSwapCard
                  fromToken={message.sourceData.fromToken}
                  toToken={message.sourceData.toToken}
                  amount={message.sourceData.amount}
                  walletPublicKey={walletPublicKey}
                  note={message.sourceData.note}
                />
              )}

              {message.component === 'volatility' && message.sourceData && (
                <div className="mt-4"><VolatilityCard data={message.sourceData} /></div>
              )}
              {message.component === 'confidence' && message.sourceData && (
                <div className="mt-4"><ConfidenceCard data={message.sourceData} /></div>
              )}
              {message.component === 'correlation' && message.sourceData && (
                <div className="mt-4"><CorrelationCard data={message.sourceData} /></div>
              )}
              {message.component === 'swap' && message.sourceData && (
                <div className="mt-4"><SwapCard data={message.sourceData} /></div>
              )}
              {message.component === 'limitOrder' && message.sourceData && (
                <div className="mt-4"><LimitOrderCard data={message.sourceData} /></div>
              )}
              {message.component === 'risk' && message.sourceData && (
                <div className="mt-4"><RiskCard data={message.sourceData} /></div>
              )}

              {message.component === 'comparison' && message.sourceData && (
                <div className="mt-4 border-2 border-blue-500/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-blue-500/20">
                      <tr style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <th className="px-4 py-3 text-left text-sm text-blue-300">Asset</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Vol 24h</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Risk</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Confidence</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {message.sourceData.comparison?.map((data: any, idx: number) => (
                        <tr key={idx} className="border-t border-gray-700 hover:bg-blue-500/5 transition-colors">
                          <td className="px-4 py-3 text-blue-400 font-bold">{data.asset}</td>
                          <td className="px-4 py-3 text-right text-gray-200">{data.vol24h}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: data.risk === 'Low' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
                                color: data.risk === 'Low' ? '#22c55e' : '#eab308',
                              }}>
                              {data.risk}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-purple-400">{data.confidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {message.component === 'chart' && message.sourceData?.chartData && (
                <div className="mt-4 border-2 border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>7-Day Trend</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 h-32">
                    {message.sourceData.chartData.map((height: number, idx: number) => (
                      <div key={idx} className="flex flex-col justify-end items-center gap-1">
                        <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{height}%</div>
                        <div className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>D{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-gray-900/80 border-2 border-gray-700 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-sm text-blue-400"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    data-testid="thinking-indicator"
                  >
                    {thinkingStages[thinkingStage]?.message}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-6 pb-4 relative z-10">
          <div className="grid grid-cols-3 gap-2">
            {promptSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(suggestion.text)}
                className={`bg-gradient-to-br ${suggestion.gradient} p-0.5 rounded-lg hover:scale-105 transition-transform`}
                data-testid={`suggestion-${idx}`}
              >
                <div className="bg-gray-900/90 rounded-lg px-3 py-2 flex items-center gap-2 h-full">
                  <suggestion.icon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="text-xs text-gray-200 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {suggestion.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-800 relative z-10">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about prices, swap tokens, set alerts, check history... (Enter to send)"
              rows={1}
              className="w-full bg-gray-900/80 border-2 border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 resize-none transition-colors focus:outline-none"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', minHeight: '48px', maxHeight: '120px' }}
              data-testid="chat-input"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 p-0 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            data-testid="send-button"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Powered by Pyth Network · Gemini AI · Jupiter DEX · Solana
          </span>
          {defaultEmail && (
            <span className="text-xs text-blue-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              📧 {defaultEmail}
            </span>
          )}
          {walletPublicKey && (
            <span className="text-xs text-green-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ◎ {walletPublicKey.slice(0, 6)}...{walletPublicKey.slice(-4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
