import type { Candle } from '@/lib/data/yahoo';

export function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function maxDrawdown(closes: number[]): number {
  let peak = closes[0] ?? 0;
  let maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (peak - c) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100;
}

export function fiftyTwoWeekRange(candles: Candle[]): { high: number; low: number; current: number; pctOfRange: number } {
  if (!candles.length) return { high: 0, low: 0, current: 0, pctOfRange: 50 };
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const current = candles[candles.length - 1].close;
  const pctOfRange = high === low ? 50 : ((current - low) / (high - low)) * 100;
  return { high, low, current, pctOfRange };
}
