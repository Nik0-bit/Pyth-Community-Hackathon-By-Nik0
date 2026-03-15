import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type HistogramData,
} from 'lightweight-charts';
import {
  computeRSI,
  computeSMA,
  computeMACD,
  computeBollinger,
  type OHLC,
} from '../utils/indicators';

const BINANCE_PREFIX = 'BINANCE:';

function binanceSymbol(tv: string): string {
  return tv.startsWith(BINANCE_PREFIX) ? tv.slice(BINANCE_PREFIX.length) : tv;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface ChartWithIndicatorsProps {
  tvSymbol: string;
  activeStudy: string | null;
  interval?: ChartInterval;
  className?: string;
}

export function ChartWithIndicators({ tvSymbol, activeStudy, interval = '1d', className = '' }: ChartWithIndicatorsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const seriesRef = useRef<{ candlestick: ISeriesApi<'Candlestick'>; indicators: ISeriesApi<'Line' | 'Histogram'>[] }>({
    candlestick: null!,
    indicators: [],
  });
  const paneIndexRef = useRef<number>(1);
  const klinesCacheRef = useRef<{ symbol: string; interval: string; klines: OHLC[] } | null>(null);

  const removeIndicatorPanes = useCallback((chart: IChartApi) => {
    const panes = chart.panes();
    while (panes.length > 1) {
      chart.removePane(1);
    }
    paneIndexRef.current = 1;
    seriesRef.current.indicators = [];
  }, []);

  useEffect(() => {
    if (!containerRef.current || !tvSymbol.startsWith(BINANCE_PREFIX)) return;

    setChartError(null);
    setLoading(true);
    const sym = binanceSymbol(tvSymbol);
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/klines?symbol=${encodeURIComponent(sym)}&interval=${interval}&limit=200`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setChartError(data.error || 'Не удалось загрузить данные');
          setLoading(false);
          return;
        }

        const klines: OHLC[] = data.klines || [];
        if (klines.length === 0) {
          setChartError('Нет данных по этому активу');
          setLoading(false);
          return;
        }

        if (!containerRef.current) return;
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const chart = createChart(containerRef.current, {
        layout: { background: { color: '#0d1117' }, textColor: '#9ca3af' },
        grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
        rightPriceScale: { borderColor: '#374151', scaleMargins: { top: 0.1, bottom: 0.2 } },
        timeScale: { borderColor: '#374151', timeVisible: true, secondsVisible: false },
      });

      const candlestick = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
      });
      seriesRef.current.candlestick = candlestick;

      const candleData = klines.map(k => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));
      candlestick.setData(candleData);
      chart.timeScale().fitContent();

        klinesCacheRef.current = { symbol: sym, interval, klines };
        chartRef.current = chart;
        setLoading(false);

        if (!activeStudy || cancelled) return;

        const closes = klines.map(k => k.close);
        const times = klines.map(k => k.time);

        if (activeStudy === 'RSI') {
        const rsi = computeRSI(closes, 14);
        chart.addPane(true);
        const line = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2 }, 1);
        line.setData(
          times.map((t, i) => ({ time: t, value: rsi[i] ?? 0 })).filter((_, i) => rsi[i] != null) as LineData[]
        );
        line.priceScale().applyOptions({ scaleMargins: { top: 0.9, bottom: 0 }, borderVisible: false });
        seriesRef.current.indicators = [line];
      } else if (activeStudy === 'MACD') {
        const { macd, signal, hist } = computeMACD(closes, 12, 26, 9);
        chart.addPane(true);
        const histSeries = chart.addSeries(HistogramSeries, { color: '#22c55e', priceScaleId: 'macd-hist' }, 1);
        histSeries.setData(
          times
            .map((t, i) => ({ time: t, value: hist[i] ?? 0, color: (hist[i] ?? 0) >= 0 ? '#22c55e' : '#ef4444' }))
            .filter((_, i) => hist[i] != null) as HistogramData[]
        );
        const line1 = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, priceScaleId: 'macd' }, 1);
        line1.setData(times.map((t, i) => ({ time: t, value: macd[i] ?? 0 })).filter((_, i) => macd[i] != null) as LineData[]);
        const line2 = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceScaleId: 'macd' }, 1);
        line2.setData(times.map((t, i) => ({ time: t, value: signal[i] ?? 0 })).filter((_, i) => signal[i] != null) as LineData[]);
        histSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 }, borderVisible: false });
        seriesRef.current.indicators = [histSeries, line1, line2];
      } else if (activeStudy === 'Moving Average' || activeStudy === 'MA') {
        const ma = computeSMA(closes, 20);
        const line = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 }, 0);
        line.setData(times.map((t, i) => ({ time: t, value: ma[i] ?? 0 })).filter((_, i) => ma[i] != null) as LineData[]);
        seriesRef.current.indicators = [line];
      } else if (activeStudy === 'Bollinger Bands') {
        const { upper, middle, lower } = computeBollinger(closes, 20, 2);
        const u = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1 }, 0);
        u.setData(times.map((t, i) => ({ time: t, value: upper[i] ?? 0 })).filter((_, i) => upper[i] != null) as LineData[]);
        const m = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1 }, 0);
        m.setData(times.map((t, i) => ({ time: t, value: middle[i] ?? 0 })).filter((_, i) => middle[i] != null) as LineData[]);
        const l = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1 }, 0);
        l.setData(times.map((t, i) => ({ time: t, value: lower[i] ?? 0 })).filter((_, i) => lower[i] != null) as LineData[]);
        seriesRef.current.indicators = [u, m, l];
      }
      } catch (e: any) {
        if (!cancelled) {
          setChartError(e?.message || 'Ошибка графика');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setLoading(false);
      klinesCacheRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [tvSymbol, retryKey, interval]);

  useEffect(() => {
    if (!chartRef.current || !tvSymbol.startsWith(BINANCE_PREFIX)) return;

    const chart = chartRef.current;

    if (!activeStudy) {
      requestAnimationFrame(() => {
        if (chartRef.current) removeIndicatorPanes(chartRef.current);
      });
      return;
    }

    const sym = binanceSymbol(tvSymbol);
    let cancelled = false;

    const applyIndicator = (klines: OHLC[]) => {
      if (cancelled || !chartRef.current) return;
      const closes = klines.map(k => k.close);
      const times = klines.map(k => k.time);

      removeIndicatorPanes(chart);

      if (activeStudy === 'RSI') {
        const rsi = computeRSI(closes, 14);
        chart.addPane(true);
        const line = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2 }, 1);
        line.setData(
          times.map((t, i) => ({ time: t, value: rsi[i] ?? 0 })).filter((_, i) => rsi[i] != null) as LineData[]
        );
        line.priceScale().applyOptions({ scaleMargins: { top: 0.9, bottom: 0 }, borderVisible: false });
        seriesRef.current.indicators = [line];
      } else if (activeStudy === 'MACD') {
        const { macd, signal, hist } = computeMACD(closes, 12, 26, 9);
        chart.addPane(true);
        const histSeries = chart.addSeries(HistogramSeries, { color: '#22c55e', priceScaleId: 'macd-hist' }, 1);
        histSeries.setData(
          times
            .map((t, i) => ({ time: t, value: hist[i] ?? 0, color: (hist[i] ?? 0) >= 0 ? '#22c55e' : '#ef4444' }))
            .filter((_, i) => hist[i] != null) as HistogramData[]
        );
        const line1 = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, priceScaleId: 'macd' }, 1);
        line1.setData(times.map((t, i) => ({ time: t, value: macd[i] ?? 0 })).filter((_, i) => macd[i] != null) as LineData[]);
        const line2 = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceScaleId: 'macd' }, 1);
        line2.setData(times.map((t, i) => ({ time: t, value: signal[i] ?? 0 })).filter((_, i) => signal[i] != null) as LineData[]);
        histSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 }, borderVisible: false });
        seriesRef.current.indicators = [histSeries, line1, line2];
      } else if (activeStudy === 'Moving Average' || activeStudy === 'MA') {
        const ma = computeSMA(closes, 20);
        const line = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 }, 0);
        line.setData(times.map((t, i) => ({ time: t, value: ma[i] ?? 0 })).filter((_, i) => ma[i] != null) as LineData[]);
        seriesRef.current.indicators = [line];
      } else if (activeStudy === 'Bollinger Bands') {
        const { upper, middle, lower } = computeBollinger(closes, 20, 2);
        const u = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1 }, 0);
        u.setData(times.map((t, i) => ({ time: t, value: upper[i] ?? 0 })).filter((_, i) => upper[i] != null) as LineData[]);
        const m = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1 }, 0);
        m.setData(times.map((t, i) => ({ time: t, value: middle[i] ?? 0 })).filter((_, i) => middle[i] != null) as LineData[]);
        const l = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1 }, 0);
        l.setData(times.map((t, i) => ({ time: t, value: lower[i] ?? 0 })).filter((_, i) => lower[i] != null) as LineData[]);
        seriesRef.current.indicators = [u, m, l];
      }
    };

    const run = () => {
      const cached = klinesCacheRef.current;
      if (cached && cached.symbol === sym && cached.interval === interval && cached.klines.length > 0) {
        requestAnimationFrame(() => {
          if (!cancelled) applyIndicator(cached.klines);
        });
        return;
      }
      (async () => {
        const res = await fetch(`/api/klines?symbol=${encodeURIComponent(sym)}&interval=${interval}&limit=200`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.success || !data.klines?.length) return;
        const klines: OHLC[] = data.klines;
        requestAnimationFrame(() => {
          if (!cancelled) applyIndicator(klines);
        });
      })();
    };

    const rafId = requestAnimationFrame(run);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [activeStudy, tvSymbol, interval, removeIndicatorPanes]);

  const isBinance = tvSymbol.startsWith(BINANCE_PREFIX);

  if (!isBinance) return null;

  return (
    <div className={`relative flex flex-col ${className}`} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80 text-gray-400 text-sm">
          Загрузка графика…
        </div>
      )}
      {chartError && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400 text-sm p-4">
          <span>{chartError}</span>
          <button
            type="button"
            className="text-purple-400 hover:underline"
            onClick={() => { setChartError(null); setLoading(true); setRetryKey(k => k + 1); }}
          >
            Повторить
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 w-full"
        style={{ display: chartError && !loading ? 'none' : 'block', height: '100%' }}
      />
    </div>
  );
}
