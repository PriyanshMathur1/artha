/**
 * Risk-adjusted return signal computation.
 * All inputs are daily log-returns (unitless, e.g. 0.005 = +0.5% day).
 */

const TRADING_DAYS = 252;
const RISK_FREE_DAILY = 0.065 / TRADING_DAYS; // ~6.5% Indian 10y G-sec annualised

/** Annualised mean return from daily log-returns */
export function annualisedReturn(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) return 0;
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  return mean * TRADING_DAYS;
}

/** Annualised standard deviation */
export function annualisedVol(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1);
  return Math.sqrt(variance * TRADING_DAYS);
}

/** Sharpe ratio: (return − risk-free) / vol */
export function sharpeRatio(dailyReturns: number[]): number | null {
  const vol = annualisedVol(dailyReturns);
  if (vol === 0) return null;
  const ret = annualisedReturn(dailyReturns);
  return (ret - 0.065) / vol;
}

/** Sortino ratio: (return − risk-free) / downside deviation */
export function sortinoRatio(dailyReturns: number[]): number | null {
  const negReturns = dailyReturns.filter((r) => r < RISK_FREE_DAILY);
  if (negReturns.length === 0) return null; // all positive — technically Inf, cap at 5
  const downsideVariance = negReturns.reduce((s, r) => s + Math.pow(r - RISK_FREE_DAILY, 2), 0) / dailyReturns.length;
  const downsideVol = Math.sqrt(downsideVariance * TRADING_DAYS);
  if (downsideVol === 0) return null;
  const ret = annualisedReturn(dailyReturns);
  return (ret - 0.065) / downsideVol;
}

/**
 * Downside capture ratio vs a benchmark.
 * Measures what fraction of benchmark's down-days the fund captures.
 * < 1.0 is good (fund falls less than benchmark).
 * We use category median returns as a proxy for the benchmark.
 */
export function downsideCaptureRatio(
  fundReturns: number[],
  benchmarkReturns: number[],
): number | null {
  if (fundReturns.length !== benchmarkReturns.length || fundReturns.length === 0) return null;

  // Identify benchmark down-days
  const downDayIndices = benchmarkReturns
    .map((r, i) => (r < 0 ? i : -1))
    .filter((i) => i >= 0);

  if (downDayIndices.length === 0) return null;

  const fundDownDayMean = downDayIndices.reduce((s, i) => s + fundReturns[i], 0) / downDayIndices.length;
  const benchDownDayMean = downDayIndices.reduce((s, i) => s + benchmarkReturns[i], 0) / downDayIndices.length;

  if (benchDownDayMean === 0) return null;
  return fundDownDayMean / benchDownDayMean;
}

/** Max drawdown from peak (returns 0-1, e.g. 0.15 = 15% drawdown) */
export function maxDrawdown(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) return 0;
  let peak = 1;
  let nav = 1;
  let maxDD = 0;
  for (const r of dailyReturns) {
    nav *= Math.exp(r);
    if (nav > peak) peak = nav;
    const dd = (peak - nav) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

/** Calmar ratio: annualised return / max drawdown (higher is better) */
export function calmarRatio(dailyReturns: number[]): number | null {
  const dd = maxDrawdown(dailyReturns);
  if (dd === 0) return null;
  return annualisedReturn(dailyReturns) / dd;
}
