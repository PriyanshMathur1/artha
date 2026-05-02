import type { Agent } from '@/lib/agents/shared/types';
import { clamp, scoreLinear } from '@/lib/utils/money';
import type { MFInput } from '../types';

interface ManagerQualitySignals {
  fundHouse: string;
  fundHouseTier: 'tier1' | 'tier2' | 'tier3';
  inceptionAgeYears: number | null;
  managerTenureYears: number | null;
  alphaVsCategory: number | null;
  aumCr: number | null;
}

/**
 * Manager-quality agent.
 *
 * v1 signals:
 *   - Fund house tier (HDFC/SBI/ICICI/Axis/Kotak/Mirae = tier1; Nippon/UTI/etc = tier2)
 *   - Scheme age (longer track record = more trust)
 *   - 3y return vs category median (alpha proxy)
 *   - AUM (too small or too large is a warning sign — sweet spot ₹500-₹15,000Cr)
 *
 * v2 should plug structured manager data: tenure, education, prior funds, awards.
 */

const TIER1 = new Set(['HDFC Mutual Fund', 'SBI Mutual Fund', 'ICICI Prudential Mutual Fund', 'Axis Mutual Fund', 'Kotak Mahindra Mutual Fund', 'Mirae Asset Mutual Fund', 'DSP Mutual Fund']);
const TIER2 = new Set(['Nippon India Mutual Fund', 'UTI Mutual Fund', 'Aditya Birla Sun Life Mutual Fund', 'Tata Mutual Fund', 'Parag Parikh Mutual Fund', 'Quant Mutual Fund', 'Canara Robeco Mutual Fund']);

export const managerQualityAgent: Agent<MFInput, ManagerQualitySignals> = {
  name: 'manager-quality',
  description: 'Fund house, scheme age, manager tenure, alpha vs category',
  weight: 0.25,

  async run(input) {
    const fundHouse = input.scheme.fundHouse;
    const fundHouseTier: ManagerQualitySignals['fundHouseTier'] =
      TIER1.has(fundHouse) ? 'tier1'
      : TIER2.has(fundHouse) ? 'tier2'
      : 'tier3';

    const inceptionAgeYears = input.meta?.inceptionDate
      ? (Date.now() - input.meta.inceptionDate.getTime()) / (365.25 * 86_400_000)
      : null;

    const managerTenureYears = input.meta?.fundManagerTenureYears ?? null;

    const alphaVsCategory = input.trailing.ret3y != null && input.categoryStats?.medianRet3y != null
      ? input.trailing.ret3y - input.categoryStats.medianRet3y
      : null;

    const aumCr = input.meta?.aumCr ?? null;

    const tierScore = fundHouseTier === 'tier1' ? 8 : fundHouseTier === 'tier2' ? 6.5 : 5;
    const ageScore = inceptionAgeYears != null
      ? clamp(scoreLinear(inceptionAgeYears, { lo: 1, hi: 12 }), 0, 10)
      : 5.5;
    const tenureScore = managerTenureYears != null
      ? clamp(scoreLinear(managerTenureYears, { lo: 1, hi: 10 }), 0, 10)
      : 5.5;
    const alphaScore = alphaVsCategory != null
      ? clamp(5 + alphaVsCategory * 0.4, 0, 10)
      : 5;
    const aumScore = aumCr != null
      ? aumCr > 50_000 ? 5         // too large, mandate-bloat
        : aumCr > 500 ? 8
        : aumCr > 100 ? 6.5
        : 4
      : 5.5;

    const score = Number(
      (tierScore * 0.25 + ageScore * 0.15 + tenureScore * 0.20 + alphaScore * 0.30 + aumScore * 0.10).toFixed(2),
    );

    const signals: ManagerQualitySignals = {
      fundHouse,
      fundHouseTier,
      inceptionAgeYears,
      managerTenureYears,
      alphaVsCategory,
      aumCr,
    };

    return {
      agentName: 'manager-quality',
      score,
      rationale: rationale(signals),
      signals,
      confidence: 0.6 + (alphaVsCategory != null ? 0.2 : 0) + (managerTenureYears != null ? 0.2 : 0),
    };
  },
};

function rationale(s: ManagerQualitySignals): string {
  const tier = s.fundHouseTier === 'tier1' ? 'top-tier' : s.fundHouseTier === 'tier2' ? 'reputable' : 'mid-tier';
  const alpha = s.alphaVsCategory != null
    ? s.alphaVsCategory > 2 ? `+${s.alphaVsCategory.toFixed(1)}pp alpha vs category` : `${s.alphaVsCategory.toFixed(1)}pp vs category`
    : 'category benchmark unavailable';
  const tenure = s.managerTenureYears != null ? `, manager ${s.managerTenureYears.toFixed(0)}y` : '';
  return `${tier[0].toUpperCase() + tier.slice(1)} fund house — ${alpha}${tenure}.`;
}
