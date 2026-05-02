import type { Verdict } from './types';

export function compositeToVerdict(score: number): Verdict {
  if (score >= 7.5) return 'STRONG_BUY';
  if (score >= 6.0) return 'BUY';
  if (score >= 4.5) return 'HOLD';
  if (score >= 3.0) return 'CAUTION';
  return 'AVOID';
}

export function verdictColor(v: Verdict): string {
  return {
    STRONG_BUY: 'text-verdict-strong-buy',
    BUY: 'text-verdict-buy',
    HOLD: 'text-verdict-hold',
    CAUTION: 'text-verdict-caution',
    AVOID: 'text-verdict-avoid',
  }[v];
}

export function verdictBadge(v: Verdict): string {
  return {
    STRONG_BUY: 'bg-verdict-strong-buy/15 text-verdict-strong-buy ring-1 ring-verdict-strong-buy/30',
    BUY: 'bg-verdict-buy/15 text-verdict-buy ring-1 ring-verdict-buy/30',
    HOLD: 'bg-verdict-hold/15 text-verdict-hold ring-1 ring-verdict-hold/30',
    CAUTION: 'bg-verdict-caution/15 text-verdict-caution ring-1 ring-verdict-caution/30',
    AVOID: 'bg-verdict-avoid/15 text-verdict-avoid ring-1 ring-verdict-avoid/30',
  }[v];
}

export function verdictLabel(v: Verdict): string {
  return {
    STRONG_BUY: 'Strong Buy',
    BUY: 'Buy',
    HOLD: 'Hold',
    CAUTION: 'Caution',
    AVOID: 'Avoid',
  }[v];
}
