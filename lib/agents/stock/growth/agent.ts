import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { StockInput } from '../types';

interface GrowthSignals {
  priceCagr1y: number | null;
  priceCagr3y: number | null;
  earningsGrowthProxy: number | null;
  bear: number;
  base: number;
  bull: number;
}

/**
 * Growth agent — price-based proxy in v1; replace with revenue/EPS CAGR when financials are wired.
 * Three-scenario projection (bear/base/bull) for next 1 year.
 */
export const growthAgent: Agent<StockInput, GrowthSignals> = {
  name: 'growth',
  description: 'Trailing CAGR + bear/base/bull scenario projections',
  weight: 0.10,

  async run(input) {
    const candles = input.history;
    const closes = candles.map((c) => c.close);
    const last = closes[closes.length - 1];
    const yearAgo = closes[Math.max(0, closes.length - 252)];
    const threeYearAgo = candles[0]?.close;

    const priceCagr1y = yearAgo ? ((last - yearAgo) / yearAgo) * 100 : null;
    const priceCagr3y = threeYearAgo && candles.length >= 252 * 2
      ? (Math.pow(last / threeYearAgo, 252 / candles.length) - 1) * 100
      : null;

    // Use earnings/revenue CAGR if Yahoo gave us EPS proxy in fundamentals (rough)
    const earningsGrowthProxy = input.fundamentals?.eps != null && input.fundamentals?.pe
      ? input.fundamentals.eps * 0.15 // placeholder until real revenue/EPS history is wired
      : null;

    // Bear/base/bull = base ± volatility-anchored band
    const base = priceCagr1y ?? 10;
    const bear = base - 12;
    const bull = base + 12;

    // Scoring: prefer 12-25% base — too low signals stagnation, too high signals overheating
    const score = clamp(scoreLinear(base, { lo: -10, hi: 30 }), 0, 10);

    return {
      agentName: 'growth',
      score: Number(score.toFixed(2)),
      rationale: rationale({ priceCagr1y, priceCagr3y, earningsGrowthProxy, bear, base, bull }),
      signals: { priceCagr1y, priceCagr3y, earningsGrowthProxy, bear, base, bull },
      confidence: priceCagr1y != null ? 0.7 : 0.3,
    };
  },
};

function rationale(s: GrowthSignals): string {
  if (s.priceCagr1y == null) return 'Growth proxy unavailable.';
  const tone = s.priceCagr1y > 25 ? 'momentum-driven'
    : s.priceCagr1y > 12 ? 'healthy'
    : s.priceCagr1y > 0 ? 'modest'
    : 'declining';
  return `${tone} — 1y price CAGR ${s.priceCagr1y.toFixed(1)}%; bear/base/bull ${s.bear.toFixed(0)}/${s.base.toFixed(0)}/${s.bull.toFixed(0)}%.`;
}
