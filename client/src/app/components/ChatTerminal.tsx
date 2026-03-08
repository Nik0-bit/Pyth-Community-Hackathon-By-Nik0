import { useState, useEffect, useRef } from 'react';
import { Send, TrendingUp, BarChart3, Code, Activity, Database, Zap, AlertTriangle, Shield, Repeat } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from 'figma:asset/04cc8725de0b5f07a5783785b96083eab87cf4b3.png';
import {
  VolatilityEngine,
  ConfidenceAnalyzer,
  CrossAssetCorrelator,
  SmartSwapEngine,
  LimitOrderManager,
  RiskManager,
} from '../utils/tradingTools';
import {
  VolatilityCard,
  ConfidenceCard,
  CorrelationCard,
  SwapCard,
  LimitOrderCard,
  RiskCard,
} from './MessageCards';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: 'comparison' | 'chart' | 'priceCard' | 'volatility' | 'confidence' | 'correlation' | 'swap' | 'limitOrder' | 'risk';
  sourceData?: any;
}

interface AIThinkingStatus {
  stage: number;
  message: string;
}

const thinkingStages: AIThinkingStatus[] = [
  { stage: 1, message: 'Connecting to Pyth Network...' },
  { stage: 2, message: 'Scanning price feeds...' },
  { stage: 3, message: 'Analyzing market data...' },
  { stage: 4, message: 'Generating response...' },
];

const promptSuggestions = [
  { icon: TrendingUp, text: 'Check SOL volatility', gradient: 'from-green-500 to-emerald-600' },
  { icon: Shield, text: 'Analyze my portfolio risk', gradient: 'from-orange-500 to-red-600' },
  { icon: Repeat, text: 'Swap 10 SOL to USDC', gradient: 'from-blue-500 to-cyan-600' },
  { icon: Zap, text: 'Set limit order for PYTH at $0.50', gradient: 'from-purple-500 to-pink-600' },
  { icon: Activity, text: 'Check BTC confidence score', gradient: 'from-yellow-500 to-orange-600' },
  { icon: BarChart3, text: 'Correlate BTC and ETH', gradient: 'from-indigo-500 to-purple-600' },
];

export function ChatTerminal() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to Akiro Labs Terminal. I\'m your AI trading assistant powered by Pyth Network.\n\n🔧 Available Tools:\n• Volatility Engine - Risk analysis\n• Confidence Analyzer - Oracle quality check\n• Cross-Asset Correlator - Market relationships\n• Smart Swap - Jupiter integration\n• Limit Order Bot - Automated orders\n• Risk Manager - Portfolio protection\n\nTry the commands below or ask me anything!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_COINMARKETCAP_API_KEY;
    setHasApiKey(!!apiKey && apiKey.trim() !== '');
  }, []);

  // Fetch real crypto prices from CoinMarketCap
  const fetchCryptoPrice = async (symbol: string) => {
    try {
      const API_KEY = import.meta.env.VITE_COINMARKETCAP_API_KEY;
      
      if (!API_KEY || API_KEY.trim() === '') {
        console.warn('CoinMarketCap API key not found. Using fallback data.');
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}&convert=USD`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': API_KEY,
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch price from CoinMarketCap');
      
      const data = await response.json();
      const coinData = data.data?.[symbol.toUpperCase()];
      
      if (!coinData) throw new Error('Coin not found');
      
      const price = coinData.quote.USD.price;
      const change24h = coinData.quote.USD.percent_change_24h;
      
      return { price, change24h };
    } catch (error) {
      console.error(`Error fetching ${symbol} price:`, error);
      
      // Fallback prices
      const mockPrices: { [key: string]: { price: number; change24h: number } } = {
        'BTC': { price: 67234.56, change24h: 2.34 },
        'SOL': { price: 148.23, change24h: 5.67 },
        'ETH': { price: 3456.78, change24h: 1.89 },
        'PYTH': { price: 0.4567, change24h: -3.45 },
        'USDC': { price: 1.0, change24h: 0.01 },
        'BNB': { price: 589.34, change24h: 4.12 },
        'ADA': { price: 0.6789, change24h: -1.23 },
      };
      
      return mockPrices[symbol.toUpperCase()] || { price: 100, change24h: 0 };
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setThinkingStage((prev) => (prev + 1) % thinkingStages.length);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  const generateMockPythData = (pair: string) => ({
    price_feed_id: '0x' + Math.random().toString(16).substr(2, 40),
    price: {
      price: (Math.random() * 1000 + 100).toFixed(2),
      conf: (Math.random() * 5).toFixed(4),
      expo: -8,
      publish_time: Date.now(),
    },
    ema_price: {
      price: (Math.random() * 1000 + 100).toFixed(2),
      conf: (Math.random() * 5).toFixed(4),
      expo: -8,
      publish_time: Date.now(),
    },
  });

  const simulateAIResponse = (userMessage: string): { content: string; component?: string; sourceData?: any } => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('check') || lowerMessage.includes('sol')) {
      const pythData = generateMockPythData('SOL/USD');
      return { 
        content: '> ✓ Connected to Pyth Network\n> ✓ Retrieved SOL/USD price feed\n\nAnalysis complete.',
        component: 'priceCard',
        sourceData: {
          pair: 'SOL/USD',
          price: 148.23,
          change24h: 5.7,
          confidence: 0.15,
          pythResponse: pythData,
        },
      };
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('volatility')) {
      return { 
        content: '> ✓ Fetching BTC and ETH data from Pyth\n> ✓ Calculating volatility metrics\n\nComparison ready:',
        component: 'comparison',
        sourceData: {
          comparison: [
            { asset: 'BTC', vol24h: '3.2%', stdDev: '2.1%', risk: 'Low', confidence: '±0.02%' },
            { asset: 'ETH', vol24h: '4.7%', stdDev: '3.4%', risk: 'Medium', confidence: '±0.05%' },
          ],
          pythResponse: {
            btc: generateMockPythData('BTC/USD'),
            eth: generateMockPythData('ETH/USD'),
          },
        },
      };
    } else if (lowerMessage.includes('alert') || lowerMessage.includes('pyth')) {
      return { 
        content: '> ✓ Setting up price alert for PYTH\n> ✓ Monitoring Pyth Network feed\n\n✅ Alert configured:\nToken: PYTH\nTarget Price: $0.50\nCurrent Price: $0.4567\nStatus: Active monitoring\n\nYou will be notified when PYTH reaches $0.50.',
        sourceData: {
          pythResponse: generateMockPythData('PYTH/USD'),
        },
      };
    } else if (lowerMessage.includes('trend') || lowerMessage.includes('analyze')) {
      return { 
        content: '> ✓ Analyzing market trends\n> ✓ Processing historical data\n\nTrend analysis complete:',
        component: 'chart',
        sourceData: {
          chartData: [45, 52, 48, 65, 58, 72, 68],
          pythResponse: generateMockPythData('MARKET/INDEX'),
        },
      };
    }
    
    return { 
      content: '> Processing your request...\n\nI can help you with:\n\n• Real-time price checks via Pyth Network\n• Volatility comparisons with confidence intervals\n• Price alerts and monitoring\n• Market trend analysis\n\nWhat would you like to explore?',
    };
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    setThinkingStage(0);

    setTimeout(async () => {
      const lowerMessage = userInput.toLowerCase();
      let response;

      if (lowerMessage.includes('sol') || lowerMessage.includes('solana')) {
        const priceData = await fetchCryptoPrice('solana');
        const pythData = generateMockPythData('SOL/USD');
        response = {
          content: '> ✓ Connected to Pyth Network\n> ✓ Retrieved SOL/USD price feed\n\nAnalysis complete.',
          component: 'priceCard',
          sourceData: {
            pair: 'SOL/USD',
            price: priceData.price,
            change24h: priceData.change24h,
            confidence: 0.15,
            pythResponse: { ...pythData, realPrice: priceData },
          },
        };
      } else if (lowerMessage.includes('compare') || lowerMessage.includes('btc') && lowerMessage.includes('eth')) {
        const btcData = await fetchCryptoPrice('bitcoin');
        const ethData = await fetchCryptoPrice('ethereum');
        response = {
          content: '> ✓ Fetching BTC and ETH data from CoinGecko\n> ✓ Calculating volatility metrics\n\nComparison ready:',
          component: 'comparison',
          sourceData: {
            comparison: [
              { asset: 'BTC', vol24h: Math.abs(btcData.change24h).toFixed(2) + '%', stdDev: '2.1%', risk: btcData.change24h < 3 ? 'Low' : 'Medium', confidence: '±0.02%' },
              { asset: 'ETH', vol24h: Math.abs(ethData.change24h).toFixed(2) + '%', stdDev: '3.4%', risk: ethData.change24h < 4 ? 'Low' : 'Medium', confidence: '±0.05%' },
            ],
            pythResponse: {
              btc: { ...generateMockPythData('BTC/USD'), realPrice: btcData },
              eth: { ...generateMockPythData('ETH/USD'), realPrice: ethData },
            },
          },
        };
      } else if (lowerMessage.includes('alert') || lowerMessage.includes('pyth')) {
        const pythData = await fetchCryptoPrice('pyth-network');
        response = {
          content: `> ✓ Setting up price alert for PYTH\n> ✓ Monitoring Pyth Network feed\n\n✅ Alert configured:\nToken: PYTH\nTarget Price: $0.50\nCurrent Price: $${pythData.price.toFixed(4)}\nStatus: Active monitoring\n\nYou will be notified when PYTH reaches $0.50.`,
          sourceData: {
            pythResponse: { ...generateMockPythData('PYTH/USD'), realPrice: pythData },
          },
        };
      } else if (lowerMessage.includes('trend') || lowerMessage.includes('analyze')) {
        response = {
          content: '> ✓ Analyzing market trends\n> ✓ Processing historical data\n\nTrend analysis complete:',
          component: 'chart',
          sourceData: {
            chartData: [45, 52, 48, 65, 58, 72, 68],
            pythResponse: generateMockPythData('MARKET/INDEX'),
          },
        };
      } else if (lowerMessage.includes('volatility') || (lowerMessage.includes('dangerous') || lowerMessage.includes('risk'))) {
        const asset = lowerMessage.includes('sol') ? 'solana' : lowerMessage.includes('btc') ? 'bitcoin' : lowerMessage.includes('eth') ? 'ethereum' : 'solana';
        const assetName = asset.charAt(0).toUpperCase() + asset.slice(1);
        const priceData = await fetchCryptoPrice(asset);
        const volAnalysis = await VolatilityEngine.quickAnalyze(assetName, priceData.change24h);
        
        response = {
          content: `> ✓ Running Volatility Engine\n> ✓ Calculating risk metrics\n\n📊 Volatility Analysis Complete`,
          component: 'volatility',
          sourceData: volAnalysis,
        };
      } else if (lowerMessage.includes('confidence') || lowerMessage.includes('oracle')) {
        const asset = lowerMessage.includes('sol') ? 'solana' : lowerMessage.includes('btc') ? 'bitcoin' : lowerMessage.includes('eth') ? 'ethereum' : 'bitcoin';
        const assetName = asset.charAt(0).toUpperCase() + asset.slice(1);
        const priceData = await fetchCryptoPrice(asset);
        const confidence = priceData.price * 0.002; // Mock confidence
        const confAnalysis = ConfidenceAnalyzer.analyze(assetName, priceData.price, confidence);
        
        response = {
          content: `> ✓ Analyzing Pyth Oracle Confidence\n> ✓ Checking price feed quality\n\n🔍 Confidence Analysis Complete`,
          component: 'confidence',
          sourceData: confAnalysis,
        };
      } else if (lowerMessage.includes('correlat') || (lowerMessage.includes('gold') || lowerMessage.includes('compare'))) {
        const btcData = await fetchCryptoPrice('bitcoin');
        const ethData = await fetchCryptoPrice('ethereum');
        const correlation = await CrossAssetCorrelator.correlate(
          'BTC', btcData.price, btcData.change24h,
          'ETH', ethData.price, ethData.change24h
        );
        
        response = {
          content: `> ✓ Cross-Asset Correlator running\n> ✓ Analyzing market relationships\n\n🔗 Correlation Analysis Complete`,
          component: 'correlation',
          sourceData: correlation,
        };
      } else if (lowerMessage.includes('swap') || lowerMessage.includes('trade') || lowerMessage.includes('exchange')) {
        const fromAsset = 'SOL';
        const toAsset = 'USDC';
        const amount = 10;
        const solData = await fetchCryptoPrice('solana');
        const usdcPrice = 1.0;
        
        const swapPreview = SmartSwapEngine.prepareSwap(fromAsset, amount, solData.price, toAsset, usdcPrice);
        
        response = {
          content: `> ✓ Smart Swap Engine activated\n> ✓ Calculating optimal route\n> ✓ Checking liquidity pools\n\n💱 Swap Preview Ready`,
          component: 'swap',
          sourceData: swapPreview,
        };
      } else if (lowerMessage.includes('limit') || lowerMessage.includes('order') || lowerMessage.includes('buy')) {
        const asset = lowerMessage.includes('pyth') ? 'pyth-network' : 'solana';
        const assetSymbol = asset === 'pyth-network' ? 'PYTH' : 'SOL';
        const priceData = await fetchCryptoPrice(asset);
        const targetPrice = lowerMessage.includes('0.50') || lowerMessage.includes('0.5') ? 0.50 : priceData.price * 0.95;
        
        const limitOrder = LimitOrderManager.createOrder(assetSymbol, 'buy', targetPrice, priceData.price, 100);
        
        response = {
          content: `> ✓ Limit Order Bot activated\n> ✓ Monitoring Pyth price feed\n\n📋 Limit Order Created`,
          component: 'limitOrder',
          sourceData: limitOrder,
        };
      } else if (lowerMessage.includes('check') && lowerMessage.includes('balance') || lowerMessage.includes('portfolio')) {
        const solData = await fetchCryptoPrice('solana');
        const usdcPrice = 1.0;
        const pythData = await fetchCryptoPrice('pyth-network');
        
        const portfolio = { SOL: 45.5, USDC: 2500, PYTH: 1000 };
        const prices = { SOL: solData.price, USDC: usdcPrice, PYTH: pythData.price };
        
        const riskAssessment = RiskManager.assess(portfolio, prices, 'SOL', 10, solData.price);
        
        response = {
          content: `> ✓ Risk Manager analyzing\n> ✓ Calculating portfolio exposure\n\n🛡️ Risk Assessment Complete`,
          component: 'risk',
          sourceData: riskAssessment,
        };
      } else {
        response = simulateAIResponse(userInput);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        component: response.component as any,
        sourceData: response.sourceData,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2400);
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] relative overflow-hidden">
      {/* Akiro Labs Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img 
          src={logoImage} 
          alt="Akiro Labs"
          className="w-96 h-96 object-contain opacity-[0.08]"
          style={{
            filter: 'hue-rotate(200deg) brightness(1.2) saturate(2)',
          }}
        />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-auto p-6 space-y-4 relative z-10">
        {messages.map((message) => (
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
                    View Source
                  </Button>
                )}
              </div>
              <div 
                className="text-gray-100 whitespace-pre-wrap"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', lineHeight: '1.6' }}
              >
                {message.content}
              </div>

              {/* Price Card */}
              {message.component === 'priceCard' && message.sourceData && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {message.sourceData.pair}
                      </div>
                      {hasApiKey ? (
                        <>
                          <div 
                            className="text-3xl font-bold mb-1" 
                            style={{ 
                              fontFamily: 'JetBrains Mono, monospace',
                              color: '#22c55e',
                              textShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                            }}
                          >
                            ${message.sourceData.price}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            Confidence: ±{message.sourceData.confidence}%
                          </div>
                        </>
                      ) : (
                        <>
                          <div 
                            className="text-3xl font-bold mb-1 text-purple-400" 
                            style={{ 
                              fontFamily: 'JetBrains Mono, monospace',
                              textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
                            }}
                          >
                            SOON
                          </div>
                          <div className="text-xs text-purple-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            Add API key to see live data
                          </div>
                        </>
                      )}
                    </div>
                    {hasApiKey ? (
                      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          +{message.sourceData.change24h}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
                        <span className="text-purple-400 font-bold text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          SOON
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: hasApiKey ? '75%' : '0%' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Comparison Table */}
              {message.component === 'comparison' && message.sourceData && (
                <div className="mt-4 border-2 border-blue-500/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-blue-500/20">
                      <tr style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <th className="px-4 py-3 text-left text-sm text-blue-300">Asset</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Vol 24h</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Std Dev</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Confidence</th>
                        <th className="px-4 py-3 text-right text-sm text-blue-300">Risk</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {message.sourceData.comparison.map((data: any, idx: number) => (
                        <tr key={idx} className="border-t border-gray-700 hover:bg-blue-500/5 transition-colors">
                          <td className="px-4 py-3 text-blue-400 font-bold">{data.asset}</td>
                          <td className="px-4 py-3 text-right text-gray-200">{data.vol24h}</td>
                          <td className="px-4 py-3 text-right text-gray-200">{data.stdDev}</td>
                          <td className="px-4 py-3 text-right text-purple-400">{data.confidence}</td>
                          <td className="px-4 py-3 text-right">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-bold"
                              style={{ 
                                backgroundColor: data.risk === 'Low' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                color: data.risk === 'Low' ? '#22c55e' : '#eab308',
                              }}
                            >
                              {data.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Chart */}
              {message.component === 'chart' && message.sourceData && (
                <div className="mt-4 border-2 border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      7-Day Trend Analysis
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 h-32">
                    {message.sourceData.chartData.map((height: number, idx: number) => (
                      <div key={idx} className="flex flex-col justify-end items-center gap-1">
                        <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {height}%
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t transition-all duration-500 hover:from-purple-400 hover:to-blue-400"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-gray-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          D{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volatility Card */}
              {message.component === 'volatility' && message.sourceData && (
                <VolatilityCard data={message.sourceData} />
              )}

              {/* Confidence Card */}
              {message.component === 'confidence' && message.sourceData && (
                <ConfidenceCard data={message.sourceData} />
              )}

              {/* Correlation Card */}
              {message.component === 'correlation' && message.sourceData && (
                <CorrelationCard data={message.sourceData} />
              )}

              {/* Swap Card */}
              {message.component === 'swap' && message.sourceData && (
                <SwapCard data={message.sourceData} />
              )}

              {/* Limit Order Card */}
              {message.component === 'limitOrder' && message.sourceData && (
                <LimitOrderCard data={message.sourceData} />
              )}

              {/* Risk Assessment Card */}
              {message.component === 'risk' && message.sourceData && (
                <RiskCard data={message.sourceData} />
              )}

              {/* Source Data Viewer */}
              <AnimatePresence>
                {expandedSource === message.id && message.sourceData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="bg-black/50 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          RAW PYTH NETWORK RESPONSE
                        </span>
                      </div>
                      <pre 
                        className="text-xs text-green-300 overflow-auto max-h-48"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {JSON.stringify(message.sourceData.pythResponse || message.sourceData, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {/* AI Thinking with Stages */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-900/80 border-2 border-gray-700 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  AI PROCESSING
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {thinkingStages[thinkingStage].message}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4 relative z-10">
          <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Try these commands:
          </div>
          <div className="flex gap-3 flex-wrap">
            {promptSuggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon;
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${suggestion.gradient} bg-opacity-20 border border-gray-700 rounded-full hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-lg`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-sm text-gray-200">{suggestion.text}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[#0d1117] p-6 relative z-10">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about prices, volatility, trends..."
              className="bg-gray-900/50 border-gray-700 border-2 text-gray-100 placeholder:text-gray-500 focus:border-purple-500/50 transition-all h-12 text-base"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 transition-all h-12 px-8 font-bold shadow-lg hover:shadow-purple-500/50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Send className="w-5 h-5 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}