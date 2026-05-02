import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { MFInput } from '../types';

interface ExpenseDragSignals {
  ter: number | null;
  categoryMedianTER: number | null;
  drag10y: number | null;       // % of corpus lost over 10y to TER
  isDirect: boolean;            // direct plans should always score better
}

/**
 * Expense-drag agent.
 *
 * The single most reliable predictor of long-term MF returns is fee minimization
 * (Bogle, 2007; SPIVA reports). A fund 0.7% cheaper compounds to ~7% larger corpus
 * over 10 years.
 *
 * Score is high when TER is low relative to category and the user is on a direct plan.
 */
export const expenseDragAgent: Agent<MFInput, ExpenseDragSignals> = {
  name: 'expense-drag',
  description: 'TER vs category, hidden costs, direct vs regular',
  weight: 0.20,

  async run(input) {
    const ter = input.meta?.expenseRatio ?? null;
    const categoryMedianTER = input.categoryStats?.medianTER ?? null;
    const isDirect = input.scheme.schemeName.toLowerCase().includes('direct');

    if (ter == null) {
      return {
        agentName: 'expense-drag',
        score: 5,
        rationale: 'Expense ratio unavailable.',
        signals: { ter: null, categoryMedianTER, drag10y: null, isDirect },
        confidence: 0.2,
        flags: ['no-ter'],
      };
    }

    // 10-year compounding drag: (1 + ter/100)^10 − 1, expressed as %
    const drag10y = (Math.pow(1 + ter / 100, 10) - 1) * 100;

    // Lower TER = higher score. Index funds at 0.10% should score ~10, regular plans at 2.5% score ~2.
    let score = clamp(scoreLinear(ter, { lo: 0.10, hi: 2.50, invert: true }), 0, 10);

    // Direct plan bonus
    if (isDirect) score = clamp(score + 0.5, 0, 10);

    // Category-relative penalty
    if (categoryMedianTER != null && ter > categoryMedianTER + 0.3) score = clamp(score - 1, 0, 10);

    return {
      agentName: 'expense-drag',
      score: Number(score.toFixed(2)),
      rationale: rationale({ ter, categoryMedianTER, drag10y, isDirect }),
      signals: { ter, categoryMedianTER, drag10y, isDirect },
      confidence: 0.9,
    };
  },
};

function rationale(s: ExpenseDragSignals): string {
  if (s.ter == null) return 'Expense ratio unavailable.';
  const planLabel = s.isDirect ? 'direct plan' : 'regular plan';
  const drag = s.drag10y != null ? ` (≈ ${s.drag10y.toFixed(1)}% corpus drag over 10y)` : '';
  return `TER ${s.ter.toFixed(2)}% — ${planLabel}${drag}.`;
}
