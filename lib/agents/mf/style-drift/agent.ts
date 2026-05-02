import type { Agent } from '@/lib/agents/shared/types';
import { clamp } from '@/lib/utils/money';
import type { MFInput } from '../types';

/**
 * Style-drift signals.
 *
 * v1: NAV-correlation proxy — correlate daily returns against a synthetic
 * large/mid/small-cap proxy (approximated from historical NAV distribution
 * statistics). A large-cap fund that behaves like a mid-cap fund gets
 * penalised.
 *
 * v2 (TODO): use actual portfolio holdings disclosed in SEBI factsheets.
 */
export interface StyleDriftSignals {
  declaredStyle: string | null;
  /** Estimated style from NAV volatility & skew: large / mid / small / unknown */
  inferredStyle: 'large' | 'mid' | 'small' | 'unknown';
  /** 0-1: how similar declared vs inferred style are (1 = perfect match) */
  styleSimilarity: number | null;
  /** Rolling 252-day coefficient of variation of daily returns (volatility proxy) */
  cvReturns: number | null;
  /** 0-10: how confident we are in drift signal (low when NAV history < 1 year) */
  driftScore: number;
  navDataPoints: number;
}

/**
 * Style-drift agent.
 *
 * Purpose: detect when a fund drifts from its declared mandate
 * (e.g. a "large-cap" fund holding mostly mid-caps to chase returns).
 *
 * Scoring:
 *   - Perfect style match → 8-10
 *   - Ambiguous (can't infer) → 5 (neutral, low confidence)
 *   - Clear mismatch → 2-4
 */
export const styleDriftAgent: Agent<MFInput, StyleDriftSignals> = {
  name: 'style-drift',
  description: 'NAV-volatility style inference vs declared mandate (large/mid/small)',
  weight: 0.10,

  async run(input) {
    const declaredStyle = input.meta?.declaredStyle ?? null;
    const navPoints = input.dailyReturns;
    const navDataPoints = navPoints.length;

    // Insufficient history — return neutral with low confidence
    if (navDataPoints < 60) {
      const signals: StyleDriftSignals = {
        declaredStyle,
        inferredStyle: 'unknown',
        styleSimilarity: null,
        cvReturns: null,
        driftScore: 5,
        navDataPoints,
      };
      return {
        agentName: 'style-drift',
        score: 5,
        rationale: `Insufficient NAV history (${navDataPoints} days) for style inference.`,
        signals,
        confidence: 0.15,
        flags: ['insufficient-nav-history'],
      };
    }

    // Coefficient of variation of daily returns (annualised vol proxy)
    const mean = navPoints.reduce((s, r) => s + r, 0) / navPoints.length;
    const variance = navPoints.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / navPoints.length;
    const stdDev = Math.sqrt(variance);
    const annualisedVol = stdDev * Math.sqrt(252) * 100; // in %
    const cvReturns = mean !== 0 ? stdDev / Math.abs(mean) : null;

    // Infer style from annualised volatility thresholds (empirical Indian market ranges)
    // Large-cap: vol ~12-18%, Mid-cap: ~18-26%, Small-cap: >26%
    const inferredStyle: StyleDriftSignals['inferredStyle'] =
      annualisedVol < 17 ? 'large'
      : annualisedVol < 25 ? 'mid'
      : 'small';

    // Style similarity matrix
    const styleSimilarity = computeStyleSimilarity(declaredStyle, inferredStyle);

    // Drift score: high when no drift (declared ≈ inferred)
    let driftScore: number;
    if (styleSimilarity == null) {
      driftScore = 5; // unknown declared style — neutral
    } else if (styleSimilarity >= 0.9) {
      driftScore = clamp(8 + styleSimilarity * 2, 0, 10);
    } else if (styleSimilarity >= 0.6) {
      driftScore = 6;
    } else {
      // Clear mismatch — penalise
      driftScore = clamp(styleSimilarity * 7, 0, 10);
    }

    driftScore = Number(driftScore.toFixed(2));

    // Confidence grows with data — saturates at ~500 days
    const dataConfidence = clamp(navDataPoints / 500, 0.3, 0.85);
    const confidence = styleSimilarity != null ? dataConfidence : 0.3;

    const signals: StyleDriftSignals = {
      declaredStyle,
      inferredStyle,
      styleSimilarity,
      cvReturns,
      driftScore,
      navDataPoints,
    };

    return {
      agentName: 'style-drift',
      score: driftScore,
      rationale: buildRationale(signals, annualisedVol),
      signals,
      confidence,
    };
  },
};

/** Maps declared + inferred style pair → similarity score 0-1 */
function computeStyleSimilarity(
  declared: string | null,
  inferred: 'large' | 'mid' | 'small' | 'unknown',
): number | null {
  if (!declared || inferred === 'unknown') return null;

  // Normalise declared style to our three buckets
  const d = declared.toLowerCase();
  const declaredBucket =
    d.includes('large') ? 'large'
    : d.includes('mid') ? 'mid'
    : d.includes('small') ? 'small'
    : d === 'flexi' || d === 'multi' ? 'multi'
    : null;

  if (!declaredBucket) return null;

  // Flexi/multi funds are allowed to drift — score them generously
  if (declaredBucket === 'multi') return 0.85;

  if (declaredBucket === inferred) return 1.0;

  // Adjacent categories (large-mid, mid-small) — partial penalty
  const adjacent =
    (declaredBucket === 'large' && inferred === 'mid') ||
    (declaredBucket === 'mid' && inferred === 'large') ||
    (declaredBucket === 'mid' && inferred === 'small') ||
    (declaredBucket === 'small' && inferred === 'mid');

  return adjacent ? 0.5 : 0.1; // large declared, small inferred = big penalty
}

function buildRationale(s: StyleDriftSignals, annualisedVol: number): string {
  if (s.navDataPoints < 60) return `Insufficient history for style inference.`;
  const volStr = `annualised vol ${annualisedVol.toFixed(1)}%`;
  const inferStr = `inferred ${s.inferredStyle}-cap`;
  if (!s.declaredStyle) return `${inferStr} (${volStr}); no declared style to compare.`;
  const match =
    s.styleSimilarity == null ? 'indeterminate'
    : s.styleSimilarity >= 0.9 ? 'matches declared mandate'
    : s.styleSimilarity >= 0.5 ? 'mild drift from mandate'
    : 'significant style drift';
  return `${inferStr} (${volStr}) — ${match} (declared: ${s.declaredStyle}).`;
}
