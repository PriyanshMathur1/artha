/** Annualised volatility from daily log returns. */
export function annualisedVol(closes: number[]): number {
  if (closes.length < 30) return 0;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function maxDrawdownPct(closes: number[]): number {
  let peak = closes[0] ?? 0;
  let dd = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const cur = (peak - c) / peak;
    if (cur > dd) dd = cur;
  }
  return dd * 100;
}

export function downsideVol(closes: number[]): number {
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const negatives = rets.filter((r) => r < 0);
  if (!negatives.length) return 0;
  const mean = negatives.reduce((a, b) => a + b, 0) / negatives.length;
  const variance = negatives.reduce((s, r) => s + (r - mean) ** 2, 0) / negatives.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}
