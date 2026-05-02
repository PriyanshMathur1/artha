import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { StockInput } from '../types';
import { sma, rsi, fiftyTwoWeekRange } from './signals';

interface TechnicalSignals {
  price: number;
  sma50: number | null;
  sma200: number | null;
  goldenCross: boolean;       // 50DMA > 200DMA
  rsi14: number | null;
  pctOfRange: number;          // 0-100, position in 52-wk range
  high52w: number;
  low52w: number;
  entryZone: { lo: number; hi: number } | null;
  stopLoss: number | null;
  signal: 'bullish' | 'neutral' | 'bearish';
}

/**
 * Technical agent — trend + momentum + position-in-range.
 * Score is weighted: trend (40%) + RSI (30%) + position (30%).
 */
export const technicalAgent: Agent<StockInput, TechnicalSignals> = {
  name: 'technical',
  description: 'Trend, momentum, entry zone, support/resistance',
  weight: 0.20,

  async run(input) {
    const candles = input.history;
    const closes = candles.map((c) => c.close).filter((c) => c > 0);
    const price = input.quote?.price ?? closes[closes.length - 1] ?? 0;

    if (closes.length < 50) {
      return {
        agentName: 'technical',
        score: 5,
        rationale: 'Insufficient price history for technicals.',
        signals: emptySignals(price),
        confidence: 0.2,
        flags: ['hist-too-short'],
      };
    }

    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, Math.min(200, closes.length - 1));
    const r = rsi(closes, 14);
    const range = fiftyTwoWeekRange(candles);
    const goldenCross = sma50 != null && sma200 != null && sma50 > sma200;

    // Trend score
    const trendScore = goldenCross ? 8 : (sma50 ?? 0) > price ? 6 : 4;

    // RSI score: 30-60 best, >70 overbought, <30 oversold
    const rsiScore = r == null ? 5
      : r >= 30 && r <= 60 ? 8
      : r > 60 && r <= 70 ? 6
      : r > 70 ? 3
      : r < 30 ? 6 // oversold often = entry chance
      : 5;

    // Position score: 30-60% of 52w range = sweet spot, >85% = caution, <20% = good entry candidate
    const posScore = range.pctOfRange >= 30 && range.pctOfRange <= 60 ? 8
      : range.pctOfRange > 85 ? 3
      : range.pctOfRange < 20 ? 7 // potential reversal entry
      : 5;

    const score = Number((trendScore * 0.4 + rsiScore * 0.3 + posScore * 0.3).toFixed(2));

    const entryZone = sma200 ? { lo: sma200 * 0.98, hi: sma200 * 1.05 } : null;
    const stopLoss = sma200 ? sma200 * 0.92 : null;

    const signal: TechnicalSignals['signal'] = score >= 7 ? 'bullish' : score >= 4.5 ? 'neutral' : 'bearish';

    const signals: TechnicalSignals = {
      price,
      sma50,
      sma200,
      goldenCross,
      rsi14: r,
      pctOfRange: range.pctOfRange,
      high52w: range.high,
      low52w: range.low,
      entryZone,
      stopLoss,
      signal,
    };

    return {
      agentName: 'technical',
      score,
      rationale: rationale(signals),
      signals,
      confidence: 1,
    };
  },
};

function rationale(s: TechnicalSignals): string {
  const dir = s.goldenCross ? 'above' : 'below';
  const rsiTone = s.rsi14 == null ? '' : s.rsi14 > 70 ? ', overbought' : s.rsi14 < 30 ? ', oversold' : '';
  const range = `${s.pctOfRange.toFixed(0)}% of 52w range`;
  return `${s.signal === 'bullish' ? 'Bullish' : s.signal === 'bearish' ? 'Bearish' : 'Neutral'} — 50DMA ${dir} 200DMA${rsiTone}, ${range}.`;
}

function emptySignals(price: number): TechnicalSignals {
  return {
    price,
    sma50: null,
    sma200: null,
    goldenCross: false,
    rsi14: null,
    pctOfRange: 50,
    high52w: price,
    low52w: price,
    entryZone: null,
    stopLoss: null,
    signal: 'neutral',
  };
}
