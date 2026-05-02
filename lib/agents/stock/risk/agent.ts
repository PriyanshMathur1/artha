import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { StockInput } from '../types';
import { annualisedVol, maxDrawdownPct } from './signals';

interface RiskSignals {
  vol: number;             // annualised vol %
  maxDD: number;           // max drawdown %
  beta: number | null;
  debtToEquity: number | null;
  riskBucket: 'low' | 'moderate' | 'high' | 'speculative';
}

/**
 * Risk agent — penalises volatility, drawdowns, and leverage.
 * Higher score = lower risk.
 */
export const riskAgent: Agent<StockInput, RiskSignals> = {
  name: 'risk',
  description: 'Volatility, drawdown, beta, leverage',
  weight: 0.10,

  async run(input) {
    const closes = input.history.map((c) => c.close).filter((c) => c > 0);
    const vol = closes.length >= 30 ? annualisedVol(closes) : 30;
    const maxDD = closes.length >= 30 ? maxDrawdownPct(closes) : 0;
    const beta = input.fundamentals?.beta ?? null;
    const debtToEquity = input.fundamentals?.debtToEquity ?? null;

    // Score components — invert because higher risk = lower score
    const volScore = clamp(scoreLinear(vol, { lo: 12, hi: 50, invert: true }), 0, 10);
    const ddScore = clamp(scoreLinear(maxDD, { lo: 5, hi: 50, invert: true }), 0, 10);
    const betaScore = beta != null
      ? clamp(scoreLinear(Math.abs(beta - 1), { lo: 0, hi: 1.5, invert: true }), 0, 10)
      : 6;
    const leverageScore = debtToEquity != null
      ? clamp(scoreLinear(debtToEquity, { lo: 0, hi: 200, invert: true }), 0, 10)
      : 6;

    const score = Number((volScore * 0.3 + ddScore * 0.3 + betaScore * 0.2 + leverageScore * 0.2).toFixed(2));

    const riskBucket: RiskSignals['riskBucket'] = score >= 7 ? 'low'
      : score >= 5 ? 'moderate'
      : score >= 3 ? 'high'
      : 'speculative';

    return {
      agentName: 'risk',
      score,
      rationale: rationale({ vol, maxDD, beta, debtToEquity, riskBucket }),
      signals: { vol, maxDD, beta, debtToEquity, riskBucket },
      confidence: closes.length >= 200 ? 1 : 0.6,
    };
  },
};

function rationale(s: RiskSignals): string {
  return `${s.riskBucket[0].toUpperCase() + s.riskBucket.slice(1)} risk — vol ${s.vol.toFixed(0)}%, max DD ${s.maxDD.toFixed(0)}%${s.beta != null ? `, beta ${s.beta.toFixed(2)}` : ''}.`;
}
