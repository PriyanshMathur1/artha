import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { StockInput } from '../types';

interface MoatSignals {
  marketCapCr: number | null;
  sectorMoatBoost: number;
  roeBoost: number;
  marginBoost: number;
  brandBoost: number;
  composite: number;
  bucket: 'wide' | 'narrow' | 'thin' | 'none';
}

/**
 * Moat agent — heuristic in v1, replace with structured signals in v2.
 *
 * Reasoning:
 *   - Large-cap (>₹50,000Cr) gets a baseline scale-moat boost.
 *   - High ROE (>20%) sustained signals capital efficiency → likely moat.
 *   - High net margin (>15%) signals pricing power.
 *   - Sector heuristic: FMCG/IT/Pharma/Insurance tend to have wider moats than commodity sectors.
 *   - Brand boost: a small set of household-name companies get +1.
 *
 * Replace heuristics with real moat data when you ingest brand-rank, switching-cost, or patent data.
 */

const WIDE_MOAT_SECTORS = new Set(['FMCG', 'IT', 'Pharma', 'Insurance', 'Consumer']);
const COMMODITY_SECTORS = new Set(['Materials', 'Energy', 'Telecom']);
const HOUSEHOLD_BRANDS = new Set([
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL',
  'ITC', 'HINDUNILVR', 'NESTLEIND', 'ASIANPAINT', 'TITAN', 'MARUTI',
  'BAJFINANCE', 'KOTAKBANK',
]);

export const moatAgent: Agent<StockInput, MoatSignals> = {
  name: 'moat',
  description: 'Brand, pricing power, switching cost, scale advantages',
  weight: 0.25,

  async run(input) {
    const f = input.fundamentals;
    const sector = input.meta?.sector ?? '';
    const marketCapCr = f?.marketCap ? f.marketCap / 1e7 : null;

    const sectorMoatBoost = WIDE_MOAT_SECTORS.has(sector)
      ? 2
      : COMMODITY_SECTORS.has(sector)
        ? -1
        : 0;

    const roeBoost = f?.roe != null
      ? clamp(scoreLinear(f.roe, { lo: 5, hi: 30 }) - 5, -2, 4)
      : 0;

    const marginBoost = f?.netMargin != null
      ? clamp(scoreLinear(f.netMargin, { lo: 5, hi: 25 }) - 5, -2, 3)
      : 0;

    const brandBoost = HOUSEHOLD_BRANDS.has(input.symbol) ? 1.5 : 0;

    const scaleBoost = marketCapCr
      ? clamp(scoreLinear(marketCapCr, { lo: 5_000, hi: 500_000 }) / 5, 0, 2)
      : 0;

    const composite = clamp(5 + sectorMoatBoost + roeBoost + marginBoost + brandBoost + scaleBoost, 0, 10);

    const bucket: MoatSignals['bucket'] = composite >= 8
      ? 'wide'
      : composite >= 6
        ? 'narrow'
        : composite >= 4
          ? 'thin'
          : 'none';

    const signals: MoatSignals = {
      marketCapCr,
      sectorMoatBoost,
      roeBoost,
      marginBoost,
      brandBoost,
      composite,
      bucket,
    };

    const confidence = (f?.roe != null ? 0.5 : 0) + (f?.netMargin != null ? 0.3 : 0) + 0.2;

    return {
      agentName: 'moat',
      score: Number(composite.toFixed(2)),
      rationale: rationale(signals, sector),
      signals,
      confidence,
    };
  },
};

function rationale(s: MoatSignals, sector: string): string {
  if (s.bucket === 'wide') return `Wide moat — ${sector} leader with strong ROE/margins, household brand recognition.`;
  if (s.bucket === 'narrow') return `Narrow moat — solid returns, scale advantage in ${sector}.`;
  if (s.bucket === 'thin') return `Thin moat — ${sector} is competitive; pricing power not evident.`;
  return `No clear moat — commodity-like dynamics in ${sector}.`;
}
