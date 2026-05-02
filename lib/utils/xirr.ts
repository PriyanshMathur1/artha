/**
 * XIRR / IRR calculation — Newton-Raphson with bisection fallback.
 * Used for SIP performance, mixed-cashflow goals, etc.
 *
 * cashflows: array of { amount, date } where outflow is negative (investment), inflow positive (redemption / current value).
 */

export interface CashFlow {
  amount: number;
  date: Date;
}

const DAYS_IN_YEAR = 365;

function npv(rate: number, cfs: CashFlow[], anchor: Date): number {
  return cfs.reduce((acc, { amount, date }) => {
    const dt = (date.getTime() - anchor.getTime()) / 86_400_000;
    return acc + amount / Math.pow(1 + rate, dt / DAYS_IN_YEAR);
  }, 0);
}

function dnpv(rate: number, cfs: CashFlow[], anchor: Date): number {
  return cfs.reduce((acc, { amount, date }) => {
    const dt = (date.getTime() - anchor.getTime()) / 86_400_000;
    const t = dt / DAYS_IN_YEAR;
    return acc - (t * amount) / Math.pow(1 + rate, t + 1);
  }, 0);
}

export function xirr(cashflows: CashFlow[], guess = 0.1): number | null {
  if (cashflows.length < 2) return null;
  const hasPositive = cashflows.some((c) => c.amount > 0);
  const hasNegative = cashflows.some((c) => c.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const anchor = sorted[0].date;

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < 80; i++) {
    const f = npv(rate, sorted, anchor);
    if (Math.abs(f) < 1e-7) return rate;
    const df = dnpv(rate, sorted, anchor);
    if (df === 0) break;
    const next = rate - f / df;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
  }

  // Bisection fallback
  let lo = -0.999;
  let hi = 100;
  let fLo = npv(lo, sorted, anchor);
  let fHi = npv(hi, sorted, anchor);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, sorted, anchor);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** CAGR for a single buy/sell pair. */
export function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}
