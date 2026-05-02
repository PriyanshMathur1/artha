/**
 * Indian-style money formatting. Uses lakh/crore convention.
 */

export function formatINR(value: number | string | null | undefined, options?: {
  compact?: boolean;       // 12.34L / 1.45Cr
  decimals?: number;
  signed?: boolean;
}): string {
  if (value == null) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';

  const { compact = false, decimals = 2, signed = false } = options ?? {};
  const sign = signed && n > 0 ? '+' : '';

  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `${sign}₹${(n / 1e7).toFixed(decimals)}Cr`;
    if (abs >= 1e5) return `${sign}₹${(n / 1e5).toFixed(decimals)}L`;
    if (abs >= 1e3) return `${sign}₹${(n / 1e3).toFixed(decimals)}K`;
    return `${sign}₹${n.toFixed(decimals)}`;
  }

  return `${sign}₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPct(value: number | null | undefined, decimals = 2, signed = false): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Map a value into 0-10 score with optional inversion (lower-is-better). */
export function scoreLinear(
  value: number,
  bounds: { lo: number; hi: number; invert?: boolean },
): number {
  const { lo, hi, invert = false } = bounds;
  if (hi === lo) return 5;
  const t = clamp((value - lo) / (hi - lo), 0, 1);
  return Number(((invert ? 1 - t : t) * 10).toFixed(2));
}

/** Inverse-log for things like PE where lower is better but doesn't fall to zero. */
export function scoreInverse(value: number, target: number, generous = 0.5): number {
  if (value <= 0) return 5;
  const ratio = target / value;
  return clamp(Math.pow(ratio, generous) * 7, 0, 10);
}
