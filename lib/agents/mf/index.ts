import { compose } from '@/lib/agents/shared/composer';
import type { CompositeResult, Agent } from '@/lib/agents/shared/types';
import { getScheme } from '@/lib/data/mfapi';
import type { MFInput } from './types';

import { managerQualityAgent } from './manager-quality/agent';
import { expenseDragAgent } from './expense-drag/agent';
import { styleDriftAgent } from './style-drift/agent';
import { riskAdjustedAgent } from './risk-adjusted/agent';
import { consistencyAgent } from './consistency/agent';
import { taxEfficiencyAgent } from './tax-efficiency/agent';

export const MF_AGENTS = [
  managerQualityAgent,   // 0.25
  expenseDragAgent,      // 0.20
  riskAdjustedAgent,     // 0.20
  consistencyAgent,      // 0.15
  styleDriftAgent,       // 0.10
  taxEfficiencyAgent,    // 0.10
] as const;

/** Weight validation: sum must be ≈ 1.0. Hard-coded total = 1.00. */
{
  const sum = MF_AGENTS.reduce((s, a) => s + a.weight, 0);
  if (Math.abs(sum - 1) > 0.01) {
    // In Next.js this will surface in the server log on startup
    console.error(
      `[mf-agents] ⚠ Weights sum to ${sum.toFixed(3)}, expected 1.000. ` +
      `Adjust agent weights before deploying.`,
    );
  }
}

/**
 * Compute daily log-returns from a NAV series.
 * Returns ln(NAV[t] / NAV[t-1]) for each consecutive pair.
 */
function computeDailyReturns(navPoints: { nav: number }[]): number[] {
  if (navPoints.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < navPoints.length; i++) {
    const prev = navPoints[i - 1].nav;
    const curr = navPoints[i].nav;
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev));
    }
  }
  return returns;
}

/**
 * Compute trailing returns from NAV history.
 * Returns null if not enough history.
 */
function computeTrailingReturn(
  navPoints: { nav: number; date: Date }[],
  yearsBack: number,
): number | null {
  if (navPoints.length < 2) return null;
  const latest = navPoints[navPoints.length - 1];
  const targetDate = new Date(latest.date);
  targetDate.setFullYear(targetDate.getFullYear() - yearsBack);

  // Find the closest NAV point at or before target date
  const pastPoint = [...navPoints]
    .reverse()
    .find((p) => p.date <= targetDate);

  if (!pastPoint || pastPoint.nav <= 0) return null;

  const totalReturn = (latest.nav / pastPoint.nav - 1) * 100;

  // CAGR for multi-year
  if (yearsBack > 1) {
    const actualYears =
      (latest.date.getTime() - pastPoint.date.getTime()) / (365.25 * 86_400_000);
    if (actualYears <= 0) return null;
    return (Math.pow(latest.nav / pastPoint.nav, 1 / actualYears) - 1) * 100;
  }

  return totalReturn;
}

/**
 * Assemble MFInput from scheme data.
 * This is the public builder used by the API route and the MF detail page.
 */
export async function buildMFInput(
  schemeCode: number | string,
  overrides?: MFInput['meta'],
  categoryStats?: MFInput['categoryStats'],
): Promise<MFInput | null> {
  const scheme = await getScheme(schemeCode);
  if (!scheme) return null;

  const nav = scheme.nav; // sorted oldest → newest by mfapi client
  const dailyReturns = computeDailyReturns(nav);

  const trailing = {
    ret1y: computeTrailingReturn(nav, 1),
    ret3y: computeTrailingReturn(nav, 3),
    ret5y: computeTrailingReturn(nav, 5),
  };

  return {
    scheme,
    trailing,
    dailyReturns,
    meta: overrides,
    categoryStats,
  };
}

/**
 * Run the full 6-agent MF deep scan and return a CompositeResult.
 *
 * @param schemeCode  AMFI scheme code (e.g. 120503 for Parag Parikh Flexi Cap)
 * @param overrides   Optional manual metadata (expenseRatio, aumCr, declaredStyle …)
 * @param categoryStats  Optional category benchmarks for relative scoring
 */
export async function runMFScan(
  schemeCode: number | string,
  overrides?: MFInput['meta'],
  categoryStats?: MFInput['categoryStats'],
): Promise<CompositeResult> {
  const input = await buildMFInput(schemeCode, overrides, categoryStats);

  if (!input) {
    // Return a minimal result indicating data unavailability
    return {
      composite: 5,
      verdict: 'HOLD',
      rationale: `Scheme ${schemeCode} not found or MFAPI unavailable.`,
      agentResults: [],
      generatedAt: new Date(),
    };
  }

  return compose([...MF_AGENTS] as unknown as Agent<MFInput>[], input);
}

export type { MFInput };
