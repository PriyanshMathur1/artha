import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { StockInput } from '../types';

interface FundamentalSignals {
  pe: number | null;
  peScore: number;
  pb: number | null;
  pbScore: number;
  roe: number | null;
  roeScore: number;
  debt: number | null;
  debtScore: number;
  margin: number | null;
  marginScore: number;
}

/**
 * Fundamental agent — classic value + quality screen.
 *
 *   PE     — lower is better, but sector-relative. Generic 0-10: <15 → 9, 30 → 5, >50 → 2.
 *   PB     — same shape, target ~3.
 *   ROE    — higher is better. >20% excellent, >12% acceptable.
 *   Debt/E — lower is better, >1 risky.
 *   Margin — net margin, >15% strong.
 */
export const fundamentalAgent: Agent<StockInput, FundamentalSignals> = {
  name: 'fundamental',
  description: 'Valuation + quality: PE, PB, ROE, debt, margins',
  weight: 0.30,

  async run(input) {
    const f = input.fundamentals;
    if (!f) {
      return {
        agentName: 'fundamental',
        score: 5,
        rationale: 'Fundamentals unavailable — neutral score.',
        signals: emptySignals(),
        confidence: 0,
        flags: ['no-fundamentals'],
      };
    }

    const signals: FundamentalSignals = {
      pe: f.pe,
      peScore: f.pe ? clamp(scoreLinear(f.pe, { lo: 8, hi: 50, invert: true }), 0, 10) : 5,
      pb: f.pb,
      pbScore: f.pb ? clamp(scoreLinear(f.pb, { lo: 0.5, hi: 8, invert: true }), 0, 10) : 5,
      roe: f.roe,
      roeScore: f.roe != null ? clamp(scoreLinear(f.roe, { lo: 5, hi: 25 }), 0, 10) : 5,
      debt: f.debtToEquity,
      debtScore: f.debtToEquity != null
        ? clamp(scoreLinear(f.debtToEquity, { lo: 0, hi: 200, invert: true }), 0, 10)
        : 5,
      margin: f.netMargin,
      marginScore: f.netMargin != null ? clamp(scoreLinear(f.netMargin, { lo: 2, hi: 25 }), 0, 10) : 5,
    };

    const score = Number(
      (signals.peScore * 0.30 +
        signals.pbScore * 0.15 +
        signals.roeScore * 0.25 +
        signals.debtScore * 0.15 +
        signals.marginScore * 0.15).toFixed(2),
    );

    const confidence = computeConfidence(signals);

    return {
      agentName: 'fundamental',
      score,
      rationale: rationale(signals),
      signals,
      confidence,
      flags: confidence < 0.6 ? ['partial-fundamentals'] : [],
    };
  },
};

function rationale(s: FundamentalSignals): string {
  const bits: string[] = [];
  if (s.pe != null) bits.push(`PE ${s.pe.toFixed(1)}`);
  if (s.roe != null) bits.push(`ROE ${s.roe.toFixed(1)}%`);
  if (s.debt != null) bits.push(`D/E ${(s.debt / 100).toFixed(2)}`);
  if (s.margin != null) bits.push(`Margin ${s.margin.toFixed(1)}%`);
  if (!bits.length) return 'Fundamental data sparse.';
  const head = s.peScore >= 6 && s.roeScore >= 6
    ? 'Quality + value combo'
    : s.roeScore >= 7
      ? 'Strong returns on equity'
      : s.peScore <= 4
        ? 'Expensive on earnings multiple'
        : 'Mixed fundamentals';
  return `${head} — ${bits.join(', ')}.`;
}

function computeConfidence(s: FundamentalSignals): number {
  const fields = [s.pe, s.pb, s.roe, s.debt, s.margin];
  const present = fields.filter((v) => v != null && Number.isFinite(v)).length;
  return present / fields.length;
}

function emptySignals(): FundamentalSignals {
  return {
    pe: null, peScore: 5,
    pb: null, pbScore: 5,
    roe: null, roeScore: 5,
    debt: null, debtScore: 5,
    margin: null, marginScore: 5,
  };
}
