/**
 * Indian capital gains and tax helpers.
 * NOTE: Rules below reflect FY24-25 / FY25-26 treatment; revisit each Budget.
 */

export type TaxRegime = 'OLD' | 'NEW';

const HOLDING_LTCG_DAYS = {
  EQUITY: 365,         // listed equity & equity MFs
  DEBT: 1095,          // bonds, debt MFs (changed by Finance Act 2023; debt MF gains taxed at slab regardless now)
  GOLD: 730,
  REAL_ESTATE: 730,
} as const;

export function holdingPeriodDays(buyDate: Date, sellDate = new Date()): number {
  const ms = sellDate.getTime() - buyDate.getTime();
  return Math.floor(ms / 86_400_000);
}

export function isLTCGEquity(buyDate: Date, sellDate = new Date()): boolean {
  return holdingPeriodDays(buyDate, sellDate) > HOLDING_LTCG_DAYS.EQUITY;
}

/**
 * Compute estimated tax on equity gains.
 * - LTCG over ₹1L taxed at 12.5% (post Jul 2024 Budget) — was 10% earlier.
 * - STCG taxed at 20% (post Jul 2024 Budget) — was 15% earlier.
 */
export function equityCapGainsTax(
  gain: number,
  buyDate: Date,
  sellDate = new Date(),
  ltcgExemption = 100_000,
): { taxRate: number; taxableAmount: number; tax: number; type: 'LTCG' | 'STCG' } {
  const isLTCG = isLTCGEquity(buyDate, sellDate);
  if (isLTCG) {
    const taxable = Math.max(0, gain - ltcgExemption);
    return { taxRate: 0.125, taxableAmount: taxable, tax: taxable * 0.125, type: 'LTCG' };
  }
  const taxable = Math.max(0, gain);
  return { taxRate: 0.2, taxableAmount: taxable, tax: taxable * 0.2, type: 'STCG' };
}

/**
 * Marginal slab rate (used for debt MFs taxed at slab).
 * Rough approximation; ignore cess for first-pass.
 */
export function marginalSlabRate(income: number, regime: TaxRegime): number {
  if (regime === 'NEW') {
    if (income <= 300_000) return 0;
    if (income <= 700_000) return 0.05;
    if (income <= 1_000_000) return 0.10;
    if (income <= 1_200_000) return 0.15;
    if (income <= 1_500_000) return 0.20;
    return 0.30;
  }
  // OLD
  if (income <= 250_000) return 0;
  if (income <= 500_000) return 0.05;
  if (income <= 1_000_000) return 0.20;
  return 0.30;
}

/** Real return after tax + inflation. */
export function realReturn(nominal: number, taxRate: number, inflation = 0.06): number {
  const afterTax = nominal * (1 - taxRate);
  return (1 + afterTax) / (1 + inflation) - 1;
}
