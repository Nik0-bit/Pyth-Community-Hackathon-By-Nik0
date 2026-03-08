// Trading and Analytics Utilities for Akiro Labs Terminal

// Pyth Network Price Feed IDs
export const PYTH_PRICE_IDS: { [key: string]: string } = {
  'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'PYTH': '0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff',
  'AVAX': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'BNB': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'ADA': '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
};

// Fetch real-time price from Pyth Network
export async function fetchPythPrice(asset: string): Promise<{ price: number; confidence: number } | null> {
  try {
    const priceId = PYTH_PRICE_IDS[asset.toUpperCase()];
    if (!priceId) return null;

    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceId}`);
    if (!response.ok) return null;

    const data = await response.json();
    const priceData = data.parsed?.[0];
    
    if (!priceData) return null;

    const price = parseFloat(priceData.price.price) * Math.pow(10, priceData.price.expo);
    const conf = parseFloat(priceData.price.conf) * Math.pow(10, priceData.price.expo);

    return { price, confidence: conf };
  } catch (error) {
    console.error('Error fetching Pyth price:', error);
    return null;
  }
}

export interface VolatilityData {
  asset: string;
  volatility: number;
  stdDev: number;
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  recommendation: string;
}

export interface ConfidenceAnalysis {
  asset: string;
  price: number;
  confidence: number;
  confidenceRange: { min: number; max: number };
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  warning: string | null;
}

export interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
  trend1: 'up' | 'down' | 'stable';
  trend2: 'up' | 'down' | 'stable';
  analysis: string;
}

export interface SwapPreview {
  from: { asset: string; amount: number; usdValue: number };
  to: { asset: string; amount: number; usdValue: number };
  rate: number;
  impact: number;
  fees: number;
  slippage: number;
}

export interface LimitOrder {
  id: string;
  asset: string;
  type: 'buy' | 'sell';
  targetPrice: number;
  currentPrice: number;
  amount: number;
  status: 'active' | 'triggered' | 'cancelled';
  progress: number;
}

export interface RiskAssessment {
  portfolioValue: number;
  tradeValue: number;
  portfolioImpact: number;
  riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
  warnings: string[];
  recommendation: string;
}

// Volatility Engine
export class VolatilityEngine {
  static async analyze(asset: string, priceHistory: number[]): Promise<VolatilityData> {
    // Calculate standard deviation
    const mean = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
    const variance = priceHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / priceHistory.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / mean) * 100;

    let risk: 'Low' | 'Medium' | 'High' | 'Extreme';
    let recommendation: string;

    if (volatility < 3) {
      risk = 'Low';
      recommendation = 'Stable asset, suitable for conservative trading';
    } else if (volatility < 6) {
      risk = 'Medium';
      recommendation = 'Moderate volatility, monitor price movements';
    } else if (volatility < 10) {
      risk = 'High';
      recommendation = 'High volatility, use stop-loss orders';
    } else {
      risk = 'Extreme';
      recommendation = 'Extreme volatility! Only for experienced traders';
    }

    return {
      asset,
      volatility: parseFloat(volatility.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      risk,
      recommendation,
    };
  }

  static async quickAnalyze(asset: string, change24h: number): Promise<VolatilityData> {
    const volatility = Math.abs(change24h);
    let risk: 'Low' | 'Medium' | 'High' | 'Extreme';
    let recommendation: string;

    if (volatility < 3) {
      risk = 'Low';
      recommendation = 'Stable asset, suitable for conservative trading';
    } else if (volatility < 6) {
      risk = 'Medium';
      recommendation = 'Moderate volatility, monitor price movements';
    } else if (volatility < 10) {
      risk = 'High';
      recommendation = 'High volatility, use stop-loss orders';
    } else {
      risk = 'Extreme';
      recommendation = 'Extreme volatility! Only for experienced traders';
    }

    return {
      asset,
      volatility: parseFloat(volatility.toFixed(2)),
      stdDev: parseFloat((volatility / 2).toFixed(2)),
      risk,
      recommendation,
    };
  }
}

// Confidence Score Analyzer (Pyth Network exclusive feature)
export class ConfidenceAnalyzer {
  static analyze(asset: string, price: number, confidence: number): ConfidenceAnalysis {
    const confidencePercent = (confidence / price) * 100;
    const min = price - confidence;
    const max = price + confidence;

    let quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    let warning: string | null = null;

    if (confidencePercent < 0.1) {
      quality = 'Excellent';
    } else if (confidencePercent < 0.5) {
      quality = 'Good';
    } else if (confidencePercent < 1) {
      quality = 'Fair';
      warning = 'Confidence interval widening - market uncertainty detected';
    } else {
      quality = 'Poor';
      warning = '⚠️ HIGH UNCERTAINTY: Price may experience significant slippage';
    }

    return {
      asset,
      price,
      confidence: parseFloat(confidencePercent.toFixed(3)),
      confidenceRange: { 
        min: parseFloat(min.toFixed(2)), 
        max: parseFloat(max.toFixed(2)) 
      },
      quality,
      warning,
    };
  }
}

// Cross-Asset Correlator
export class CrossAssetCorrelator {
  static async correlate(
    asset1: string, 
    price1: number, 
    change1: number,
    asset2: string, 
    price2: number, 
    change2: number
  ): Promise<CorrelationData> {
    // Simplified correlation based on price changes
    const trend1 = change1 > 1 ? 'up' : change1 < -1 ? 'down' : 'stable';
    const trend2 = change2 > 1 ? 'up' : change2 < -1 ? 'down' : 'stable';

    let correlation: number;
    let analysis: string;

    if (trend1 === trend2 && trend1 !== 'stable') {
      correlation = 0.85;
      analysis = `Strong positive correlation: Both assets moving ${trend1}. ${asset1} and ${asset2} showing synchronized market behavior.`;
    } else if ((trend1 === 'up' && trend2 === 'down') || (trend1 === 'down' && trend2 === 'up')) {
      correlation = -0.65;
      analysis = `Negative correlation detected: ${asset1} moving ${trend1} while ${asset2} moving ${trend2}. Consider hedging strategies.`;
    } else {
      correlation = 0.15;
      analysis = `Low correlation: Assets moving independently. Diversification opportunity identified.`;
    }

    return {
      asset1,
      asset2,
      correlation: parseFloat(correlation.toFixed(2)),
      trend1,
      trend2,
      analysis,
    };
  }
}

// Smart Swap Engine
export class SmartSwapEngine {
  static prepareSwap(
    fromAsset: string,
    fromAmount: number,
    fromPrice: number,
    toAsset: string,
    toPrice: number
  ): SwapPreview {
    const fromUsdValue = fromAmount * fromPrice;
    const feePercent = 0.003; // 0.3% fee
    const fees = fromUsdValue * feePercent;
    const afterFees = fromUsdValue - fees;
    
    // Simulate slippage based on trade size
    const slippage = fromUsdValue > 10000 ? 0.5 : fromUsdValue > 1000 ? 0.2 : 0.1;
    const impact = (slippage / 100) * afterFees;
    
    const toAmount = (afterFees - impact) / toPrice;
    const rate = toAmount / fromAmount;

    return {
      from: { asset: fromAsset, amount: fromAmount, usdValue: fromUsdValue },
      to: { asset: toAsset, amount: parseFloat(toAmount.toFixed(6)), usdValue: afterFees - impact },
      rate: parseFloat(rate.toFixed(6)),
      impact: parseFloat(impact.toFixed(2)),
      fees: parseFloat(fees.toFixed(2)),
      slippage: parseFloat(slippage.toFixed(2)),
    };
  }
}

// Limit Order Manager
export class LimitOrderManager {
  static createOrder(
    asset: string,
    type: 'buy' | 'sell',
    targetPrice: number,
    currentPrice: number,
    amount: number
  ): LimitOrder {
    const progress = type === 'buy' 
      ? Math.min(100, Math.max(0, ((currentPrice - targetPrice) / currentPrice) * 100))
      : Math.min(100, Math.max(0, ((targetPrice - currentPrice) / targetPrice) * 100));

    return {
      id: Date.now().toString(),
      asset,
      type,
      targetPrice,
      currentPrice,
      amount,
      status: Math.abs(currentPrice - targetPrice) / currentPrice < 0.01 ? 'triggered' : 'active',
      progress: Math.abs(progress),
    };
  }
}

// Risk Manager
export class RiskManager {
  static assess(
    portfolioBalance: { [asset: string]: number },
    prices: { [asset: string]: number },
    tradeAsset: string,
    tradeAmount: number,
    tradePrice: number
  ): RiskAssessment {
    // Calculate portfolio value
    const portfolioValue = Object.entries(portfolioBalance).reduce(
      (total, [asset, amount]) => total + (amount * (prices[asset] || 0)),
      0
    );

    const tradeValue = tradeAmount * tradePrice;
    const portfolioImpact = (tradeValue / portfolioValue) * 100;

    let riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
    const warnings: string[] = [];
    let recommendation: string;

    if (portfolioImpact < 10) {
      riskLevel = 'Safe';
      recommendation = 'Trade size is within safe limits. Proceed with confidence.';
    } else if (portfolioImpact < 25) {
      riskLevel = 'Moderate';
      recommendation = 'Moderate exposure. Consider dollar-cost averaging.';
      warnings.push('This trade will use ' + portfolioImpact.toFixed(1) + '% of your portfolio');
    } else if (portfolioImpact < 50) {
      riskLevel = 'High';
      recommendation = 'High risk exposure. Strongly recommend reducing trade size.';
      warnings.push('⚠️ High portfolio concentration risk');
      warnings.push('This trade will use ' + portfolioImpact.toFixed(1) + '% of your portfolio');
    } else {
      riskLevel = 'Critical';
      recommendation = '🚨 CRITICAL: This trade is too large for your portfolio size!';
      warnings.push('🚨 DANGEROUS: Over 50% portfolio exposure');
      warnings.push('Risk of total portfolio loss');
      warnings.push('Strongly advised to reduce trade size by at least 50%');
    }

    return {
      portfolioValue: parseFloat(portfolioValue.toFixed(2)),
      tradeValue: parseFloat(tradeValue.toFixed(2)),
      portfolioImpact: parseFloat(portfolioImpact.toFixed(2)),
      riskLevel,
      warnings,
      recommendation,
    };
  }
}