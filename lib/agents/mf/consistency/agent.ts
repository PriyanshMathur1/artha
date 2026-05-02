import type { Agent } from '@/lib/agents/shared/types';
import { clamp } from '@/lib/utils/money';
import type { MFInput } from '../types';

export interface ConsistencySignals {
  /** % of rolling 252-day windows that beat category top-quartile threshold */
  topQuartileHitRatePct: number | null;
  /** % of rolling windows with positive return (basic consistency floor) */
  positiveWindowsPct: number | null;
  /** Return distribution: mean, stdDev, skew of annual rolling returns */
  annualReturnMean: number | null;
  annualReturnStdDev: number | null;
  /** Skewness of rolling annual returns (positive = good, right tail) */
  returnSkewness: number | null;
  /** How many rolling windows were computed */
  rollingWindows: number;
  /** 1y / 3y trailing returns (percentage) */
  ret1yPct: number | null;
  ret3yPct: number | null;
}

/**
 * Consistency agent.
 *
 * A fund that delivers spectacular 1-year returns but is volatile year-to-year
 * is worse than a fund that reliably beats its category every year.
 * This agent rewards predictability and penalises feast-or-famine return patterns.
 *
 * Signals:
 *   1. Top-quartile hit rate — % of rolling 252-day windows where fund beats
 *      the category top-quartile threshold (from MFInput.categoryStats).
 *      Falls back to measuring positive-return windows if threshold unavailable.
 *   2. Return distribution stats — skewness (positive skew = right-tail wins = good).
 *   3. Trailing 1y/3y returns as sanity anchors.
 *
 * Score:
 *   Primarily driven by top-quartile hit rate.
 *   Positive skewness adds 0.5–1 point bonus.
 *   Negative skewness (crash-prone) deducts 0.5–1 point.
 */
export const consistencyAgent: Agent<MFInput, ConsistencySignals> = {
  name: 'consistency',
  description: 'Rolling top-quartile hit rate, return distribution skewness',
  weight: 0.15,

  async run(input) {
    const dr = input.dailyReturns;
    const WINDOW = 252; // ~1 year

    // Need at least 2 full years of daily returns for rolling analysis
    if (dr.length < WINDOW * 2) {
      const signals: ConsistencySignals = {
        topQuartileHitRatePct: null,
        positiveWindowsPct: null,
        annualReturnMean: null,
        annualReturnStdDev: null,
        returnSkewness: null,
        rollingWindows: 0,
        ret1yPct: input.trailing.ret1y,
        ret3yPct: input.trailing.ret3y,
      };
      return {
        agentName: 'consistency',
        score: 5,
        rationale: `Insufficient history (${dr.length} days). Need ≥ ${WINDOW * 2} trading days.`,
        signals,
        confidence: 0.15,
        flags: ['insufficient-history'],
      };
    }

    // Build rolling 252-day cumulative returns
    const rollingReturns: number[] = [];
    for (let i = WINDOW; i <= dr.length; i++) {
      const window = dr.slice(i - WINDOW, i);
      const cumReturn = window.reduce((s, r) => s + r, 0) * 100; // annualised as simple sum of log-returns × 100
      rollingReturns.push(cumReturn);
    }

    const rollingWindows = rollingReturns.length;
    const tqThreshold = input.categoryStats?.topQuartileRet3y ?? null; // fallback to 3y threshold (imperfect but useful)
    const tqAnnual = tqThreshold != null ? tqThreshold : null;

    const topQuartileHits = tqAnnual != null
      ? rollingReturns.filter((r) => r >= tqAnnual).length
      : null;
    const topQuartileHitRatePct = topQuartileHits != null
      ? Number(((topQuartileHits / rollingWindows) * 100).toFixed(1))
      : null;

    const positiveWindows = rollingReturns.filter((r) => r > 0).length;
    const positiveWindowsPct = Number(((positiveWindows / rollingWindows) * 100).toFixed(1));

    // Distribution stats
    const mean = rollingReturns.reduce((s, r) => s + r, 0) / rollingWindows;
    const variance = rollingReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / rollingWindows;
    const stdDev = Math.sqrt(variance);
    const skewness = rollingWindows > 2 && stdDev > 0
      ? (rollingReturns.reduce((s, r) => s + Math.pow((r - mean) / stdDev, 3), 0)) / rollingWindows
      : null;

    const signals: ConsistencySignals = {
      topQuartileHitRatePct,
      positiveWindowsPct,
      annualReturnMean: Number(mean.toFixed(2)),
      annualReturnStdDev: Number(stdDev.toFixed(2)),
      returnSkewness: skewness != null ? Number(skewness.toFixed(3)) : null,
      rollingWindows,
      ret1yPct: input.trailing.ret1y,
      ret3yPct: input.trailing.ret3y,
    };

    // Score based on hit rate or positive window rate
    const hitRate = topQuartileHitRatePct ?? positiveWindowsPct;
    let score = hitRateToScore(hitRate);

    // Skewness adjustment
    if (skewness != null) {
      score = clamp(score + skewness * 0.5, 0, 10);
    }

    score = Number(clamp(score, 0, 10).toFixed(2));

    // Confidence grows with number of rolling windows (saturates around 750 = 5y)
    const confidence = clamp(0.2 + rollingWindows / 750, 0.2, 0.90);

    return {
      agentName: 'consistency',
      score,
      rationale: buildRationale(signals, tqAnnual),
      signals,
      confidence,
    };
  },
};

function hitRateToScore(hitRatePct: number | null): number {
  if (hitRatePct == null) return 5;
  // 0% → 1, 25% → 3, 50% → 6, 75% → 8.5, 100% → 10
  if (hitRatePct <= 0) return 1;
  if (hitRatePct <= 25) return clamp(1 + (hitRatePct / 25) * 2, 1, 3);
  if (hitRatePct <= 50) return clamp(3 + ((hitRatePct - 25) / 25) * 3, 3, 6);
  if (hitRatePct <= 75) return clamp(6 + ((hitRatePct - 50) / 25) * 2.5, 6, 8.5);
  return clamp(8.5 + ((hitRatePct - 75) / 25) * 1.5, 8.5, 10);
}

function buildRationale(s: ConsistencySignals, tqThreshold: number | null): string {
  const parts: string[] = [];
  if (s.topQuartileHitRatePct != null && tqThreshold != null) {
    parts.push(`Top-quartile (>${tqThreshold.toFixed(0)}% ann) in ${s.topQuartileHitRatePct}% of rolling years`);
  } else if (s.positiveWindowsPct != null) {
    parts.push(`Positive annual return in ${s.positiveWindowsPct}% of rolling years`);
  }
  if (s.returnSkewness != null) {
    const skewDesc = s.returnSkewness > 0.3 ? 'positive skew (right-tail wins)' : s.returnSkewness < -0.3 ? 'negative skew (crash-prone)' : 'near-symmetric distribution';
    parts.push(skewDesc);
  }
  if (s.annualReturnMean != null) {
    parts.push(`avg rolling return ${s.annualReturnMean.toFixed(1)}%`);
  }
  return parts.length ? parts.join('; ') + '.' : 'Consistency stats unavailable.';
}
