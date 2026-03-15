/** Simple technical indicator helpers for chart overlay */

export interface OHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export function computeRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = Array(closes.length).fill(null);
  for (let i = period; i < closes.length; i++) {
    let gain = 0, loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const ch = closes[j] - closes[j - 1];
      if (ch > 0) gain += ch; else loss -= ch;
    }
    const avgGain = gain / period, avgLoss = loss / period;
    if (avgLoss === 0) out[i] = 100;
    else out[i] = 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function computeSMA(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    out[i] = sum / period;
  }
  return out;
}

export function computeEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = Array(values.length).fill(null);
  if (values.length < period) return out;
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

export function computeMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalLen = 9
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const fastEma = computeEMA(closes, fast);
  const slowEma = computeEMA(closes, slow);
  const macd: (number | null)[] = closes.map((_, i) =>
    fastEma[i] != null && slowEma[i] != null ? fastEma[i]! - slowEma[i]! : null
  );
  const signalLine: (number | null)[] = [];
  const k = 2 / (signalLen + 1);
  let ema: number | null = null;
  let count = 0;
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] == null) {
      signalLine.push(null);
      ema = null;
      count = 0;
    } else {
      count++;
      if (count < signalLen) {
        signalLine.push(null);
      } else if (count === signalLen) {
        let sum = 0;
        let n = 0;
        for (let j = i; j >= 0 && n < signalLen; j--) {
          if (macd[j] != null) {
            sum += macd[j]!;
            n++;
          }
        }
        ema = n > 0 ? sum / n : null;
        signalLine.push(ema);
      } else {
        ema = ema != null ? macd[i]! * k + ema * (1 - k) : macd[i];
        signalLine.push(ema);
      }
    }
  }
  const hist = macd.map((m, i) => {
    const s = signalLine[i];
    return m != null && s != null ? m - s : null;
  });
  return { macd, signal: signalLine, hist };
}

export function computeBollinger(closes: number[], period = 20, mult = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = computeSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (middle[i] == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    let count = 0;
    for (let j = Math.max(0, i - period + 1); j <= i; j++) {
      sumSq += (closes[j] - middle[i]!) ** 2;
      count++;
    }
    const std = count > 0 ? Math.sqrt(sumSq / count) : 0;
    upper.push(middle[i]! + mult * std);
    lower.push(middle[i]! - mult * std);
  }
  return { upper, middle, lower };
}
