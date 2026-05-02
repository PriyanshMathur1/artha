import type { Agent } from '@/lib/agents/shared/types';
import { clamp } from '@/lib/utils/money';
import type { MFInput } from '../types';
import {
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  calmarRatio,
  annualisedVol,
  annualisedReturn,
} from './signals';

export interface RiskAdjustedSignals {
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  maxDrawdownPct: number | null;
  annualisedVolPct: number | null;
  annualisedReturnPct: number | null;
  navDataPoints: number;
}

/**
 * Risk-adjusted return agent.
 *
 * Evaluates how efficiently the fund converts volatility into returns.
 * A fund with mediocre absolute returns but stellar risk-adjustment is
 * better than a volatile fund with the same raw return.
 *
 * Primary signals:
 *   - Sharpe: excess return per unit of total volatility
 *   - Sortino: excess return per unit of downside volatility (preferred)
 *   - Calmar: return / max-drawdown (regime sensitivity)
 *   - Max drawdown: raw worst-case loss from peak
 *
 * Score guide:
 *   Sortino > 2   → 9–10
 *   Sortino 1–2   → 7–9
 *   Sortino 0–1   → 4–7
 *   Sortino < 0   → 1–4
 *   (capped/floored and blended with Sharpe + Calmar)
 */
export const riskAdjustedAgent: Agent<MFInput, RiskAdjustedSignals> = {
  name: 'risk-adjusted',
  description: 'Sharpe, Sortino, Calmar, max-drawdown from daily NAV returns',
  weight: 0.20,

  async run(input) {
    const dr = input.dailyReturns;
    const navDataPoints = dr.length;

    // Need at least 120 trading days (~6 months) for meaningful stats
    if (navDataPoints < 120) {
      const signals: RiskAdjustedSignals = {
        sharpe: null,
        sortino: null,
        calmar: null,
        maxDrawdownPct: null,
        annualisedVolPct: null,
        annualisedReturnPct: null,
        navDataPoints,
      };
      return {
        agentName: 'risk-adjusted',
        score: 5,
        rationale: `Insufficient history (${navDataPoints} days). Need ≥ 120 trading days.`,
        signals,
        confidence: 0.1,
        flags: ['insufficient-history'],
      };
    }

    const sharpe = sharpeRatio(dr);
    const sortino = sortinoRatio(dr);
    const calmar = calmarRatio(dr);
    const maxDD = maxDrawdown(dr);
    const vol = annualisedVol(dr);
    const ret = annualisedReturn(dr);

    const signals: RiskAdjustedSignals = {
      sharpe: sharpe != null ? Number(sharpe.toFixed(3)) : null,
      sortino: sortino != null ? Number(sortino.toFixed(3)) : null,
      calmar: calmar != null ? Number(calmar.toFixed(3)) : null,
      maxDrawdownPct: Number((maxDD * 100).toFixed(2)),
      annualisedVolPct: Number((vol * 100).toFixed(2)),
      annualisedReturnPct: Number((ret * 100).toFixed(2)),
      navDataPoints,
    };

    // Score each metric independently, then blend
    const sharpeScore = sharpe != null ? sharpeToScore(sharpe) : 5;
    const sortinoScore = sortino != null ? sortinoToScore(sortino) : 5;
    const calmarScore = calmar != null ? calmarToScore(calmar) : 5;
    const drawdownScore = drawdownToScore(maxDD);

    // Sortino is primary (penalises downside asymmetrically)
    const score = Number(
      (
        sortinoScore * 0.40 +
        sharpeScore  * 0.25 +
        calmarScore  * 0.20 +
        drawdownScore * 0.15
      ).toFixed(2),
    );

    // Confidence: grows with history depth
    const confidence = clamp(0.4 + navDataPoints / 1000, 0.4, 0.95);

    return {
      agentName: 'risk-adjusted',
      score: clamp(score, 0, 10),
      rationale: buildRationale(signals),
      signals,
      confidence,
    };
  },
};

function sharpeToScore(s: number): number {
  // < 0 → 1, 0-1 → 4-6, 1-2 → 6-8, > 2 → 9-10
  if (s < 0) return clamp(4 + s * 4, 1, 4);
  if (s < 1) return clamp(4 + s * 2, 4, 6);
  if (s < 2) return clamp(6 + (s - 1) * 2, 6, 8);
  return clamp(8 + (s - 2) * 1, 8, 10);
}

function sortinoToScore(s: number): number {
  if (s < 0) return clamp(3 + s * 3, 1, 3);
  if (s < 1) return clamp(3 + s * 3, 3, 6);
  if (s < 2) return clamp(6 + (s - 1) * 3, 6, 9);
  return clamp(9 + (s - 2) * 0.5, 9, 10);
}

function calmarToScore(c: number): number {
  if (c < 0) return 2;
  if (c < 0.5) return clamp(3 + c * 4, 3, 5);
  if (c < 1) return clamp(5 + (c - 0.5) * 4, 5, 7);
  if (c < 2) return clamp(7 + (c - 1) * 2, 7, 9);
  return 10;
}

function drawdownToScore(dd: number): number {
  // dd is fraction (0.30 = 30% drawdown)
  // < 10% → 9–10, 10–20% → 6–9, 20–35% → 3–6, > 35% → 1–3
  const pct = dd * 100;
  if (pct < 10) return clamp(10 - pct * 0.1, 9, 10);
  if (pct < 20) return clamp(9 - (pct - 10) * 0.3, 6, 9);
  if (pct < 35) return clamp(6 - (pct - 20) * 0.2, 3, 6);
  return clamp(3 - (pct - 35) * 0.05, 1, 3);
}

function buildRationale(s: RiskAdjustedSignals): string {
  const parts: string[] = [];
  if (s.sortino != null) parts.push(`Sortino ${s.sortino.toFixed(2)}`);
  if (s.sharpe != null) parts.push(`Sharpe ${s.sharpe.toFixed(2)}`);
  if (s.maxDrawdownPct != null) parts.push(`max-DD ${s.maxDrawdownPct.toFixed(1)}%`);
  if (s.annualisedReturnPct != null && s.annualisedVolPct != null) {
    parts.push(`${s.annualisedReturnPct.toFixed(1)}% ret / ${s.annualisedVolPct.toFixed(1)}% vol`);
  }
  return parts.length ? parts.join(' · ') + '.' : 'Risk stats unavailable.';
}
