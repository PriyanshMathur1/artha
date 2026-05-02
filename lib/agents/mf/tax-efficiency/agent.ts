import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { MFInput } from '../types';

export interface TaxEfficiencySignals {
  /** Estimated portfolio turnover ratio (0–1 proxy from NAV pattern changes) */
  estimatedTurnoverProxy: number | null;
  /** Annual short-term capital gains drag (%) — estimated from turnover proxy */
  estimatedCapGainsDragPct: number | null;
  /** Whether this is an ELSS fund (80C tax benefit, but 3-year lock-in) */
  isElss: boolean;
  /** Whether this is a direct plan (saves ~0.5–1% TER vs regular) */
  isDirect: boolean;
  /** Whether this is a debt/liquid fund (less tax-efficient post-2023 amendment) */
  isDebtFund: boolean;
  /** Whether this is an index fund (minimal turnover, predictable tax) */
  isIndexFund: boolean;
  schemeCategory: string;
}

/**
 * Tax-efficiency agent.
 *
 * India-specific tax considerations for mutual funds (FY2024 rules):
 *
 * 1. Equity funds held > 1 year: 10% LTCG on gains > ₹1L (favourable).
 * 2. Equity funds held < 1 year: 15% STCG (less favourable, turnover-driven).
 * 3. Debt funds post-Mar 2023: taxed at income-tax slab rates regardless of holding.
 *    This makes debt MFs tax-INEFFICIENT for investors in 30% bracket.
 * 4. ELSS: 80C deduction up to ₹1.5L, 3-year lock-in, taxed like equity LTCG.
 *    Net benefit for 30% bracket ≈ ₹45K tax saving (significant).
 * 5. High-turnover active funds generate more STCG pass-through.
 *
 * v1 signals:
 *   - Turnover proxy from NAV volatility pattern (imperfect; v2 should use AMFI disclosures)
 *   - ELSS flag (significant tax benefit)
 *   - Direct vs regular (not a tax signal per se, but cost drag)
 *   - Debt fund flag (post-2023 tax dis-advantage)
 *   - Index fund flag (near-zero turnover)
 */
export const taxEfficiencyAgent: Agent<MFInput, TaxEfficiencySignals> = {
  name: 'tax-efficiency',
  description: 'Turnover proxy, cap-gains drag, ELSS lock-in benefit, debt-fund penalty',
  weight: 0.10,

  async run(input) {
    const { scheme, meta, dailyReturns } = input;
    const categoryLower = scheme.schemeCategory.toLowerCase();
    const nameLower = scheme.schemeName.toLowerCase();

    const isElss = meta?.isElss ?? (
      categoryLower.includes('elss') ||
      nameLower.includes('tax saver') ||
      nameLower.includes('taxsaver') ||
      nameLower.includes('tax saving')
    );

    const isDirect = nameLower.includes('direct');

    const isDebtFund =
      categoryLower.includes('debt') ||
      categoryLower.includes('liquid') ||
      categoryLower.includes('overnight') ||
      categoryLower.includes('money market') ||
      categoryLower.includes('ultra short') ||
      categoryLower.includes('short duration') ||
      categoryLower.includes('medium duration') ||
      categoryLower.includes('long duration') ||
      categoryLower.includes('gilt') ||
      categoryLower.includes('credit risk') ||
      categoryLower.includes('floater') ||
      categoryLower.includes('conservative hybrid');

    const isIndexFund =
      nameLower.includes('index') ||
      nameLower.includes('nifty') ||
      nameLower.includes('sensex') ||
      nameLower.includes('bse') ||
      nameLower.includes('etf');

    // Turnover proxy: count direction-reversals in NAV changes as a rough activity signal
    // (High reversals ≈ high trading; index funds have almost none)
    let estimatedTurnoverProxy: number | null = null;
    if (dailyReturns.length >= 60) {
      const reversals = dailyReturns.slice(1).filter(
        (r, i) => Math.sign(r) !== Math.sign(dailyReturns[i]) && Math.abs(r) > 0.001,
      ).length;
      // Normalise: 0 (index fund) to ~0.6 (very active), cap at 1
      estimatedTurnoverProxy = clamp(reversals / dailyReturns.length, 0, 1);
    }

    // Estimated STCG drag: turnover fraction × 15% STCG tax × average pre-tax gain
    // A fund with 50% annual turnover at 12% returns generates ≈ 50% × 12% × 15% ≈ 0.9% drag
    const avgReturnPct = input.trailing.ret1y ?? 12; // fallback
    const estimatedCapGainsDragPct = estimatedTurnoverProxy != null
      ? Number((estimatedTurnoverProxy * avgReturnPct * 0.15).toFixed(2))
      : null;

    const signals: TaxEfficiencySignals = {
      estimatedTurnoverProxy,
      estimatedCapGainsDragPct,
      isElss,
      isDirect,
      isDebtFund,
      isIndexFund,
      schemeCategory: scheme.schemeCategory,
    };

    // Scoring
    let score = 6; // default neutral-good for equity fund

    // --- Positive signals ---
    if (isIndexFund) score += 2;          // near-zero turnover, predictable LTCG
    if (isElss) score += 1.5;             // 80C benefit is substantial
    if (isDirect) score = clamp(score + 0.5, 0, 10); // not a tax benefit, but cost benefit

    // --- Negative signals ---
    if (isDebtFund) score = clamp(score - 2.5, 0, 10); // post-2023 taxed at slab rate

    // Turnover drag penalty
    if (estimatedTurnoverProxy != null) {
      // High turnover → high STCG drag
      const turnoverPenalty = scoreLinear(estimatedTurnoverProxy, { lo: 0, hi: 0.5, invert: true }) * 0.3;
      score = clamp(score - (3 - turnoverPenalty * 0.3), 0, 10);
      // Simplify: subtract up to 1.5 for very high turnover
      score = clamp(score + turnoverToAdjustment(estimatedTurnoverProxy), 0, 10);
    }

    score = Number(clamp(score, 0, 10).toFixed(2));

    // Confidence: high when we can identify fund type clearly; lower without turnover data
    const confidence = estimatedTurnoverProxy != null ? 0.65 : 0.4;

    return {
      agentName: 'tax-efficiency',
      score,
      rationale: buildRationale(signals),
      signals,
      confidence,
    };
  },
};

function turnoverToAdjustment(proxy: number): number {
  // proxy 0–0.1 (index-like): +0.5
  // proxy 0.1–0.3 (moderate): 0
  // proxy 0.3–0.5 (high): -1
  // proxy > 0.5 (very high): -2
  if (proxy < 0.1) return 0.5;
  if (proxy < 0.3) return 0;
  if (proxy < 0.5) return -1;
  return -2;
}

function buildRationale(s: TaxEfficiencySignals): string {
  const parts: string[] = [];

  if (s.isElss) parts.push('ELSS — 80C benefit (₹45K saving at 30% bracket)');
  if (s.isIndexFund) parts.push('index fund — minimal turnover, predictable LTCG');
  if (s.isDebtFund) parts.push('debt fund — taxed at slab rate post-Mar 2023 (tax-inefficient)');

  if (s.estimatedCapGainsDragPct != null) {
    parts.push(`est. STCG drag ≈ ${s.estimatedCapGainsDragPct.toFixed(2)}%/yr`);
  } else {
    parts.push('turnover data unavailable');
  }

  if (!s.isDirect) parts.push('regular plan (consider switching to direct for cost savings)');

  return parts.length ? parts.join('; ') + '.' : 'Tax efficiency signal unavailable.';
}
