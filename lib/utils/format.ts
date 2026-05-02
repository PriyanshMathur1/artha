/**
 * Date / time formatting helpers — zero external dependencies.
 *
 * We intentionally avoid date-fns here: v4 ships only .d.cts type declarations
 * which don't resolve correctly under TypeScript's `moduleResolution: bundler`.
 * Native Intl + Date arithmetic covers our needs cleanly.
 */

/* ── Date formatting ────────────────────────────────────────────────── */

/**
 * Format a date for display.
 * Default output: "12 Jan 2025"
 */
export function fmtDate(
  d: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', opts).format(date);
}

/**
 * Compact date: "12 Jan 25"
 */
export function fmtDateShort(d: Date | string | null | undefined): string {
  return fmtDate(d, { day: '2-digit', month: 'short', year: '2-digit' });
}

/**
 * Full timestamp: "12 Jan 2025, 3:45 PM"
 */
export function fmtDateTime(d: Date | string | null | undefined): string {
  return fmtDate(d, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Relative time ──────────────────────────────────────────────────── */

/**
 * Human-readable relative time: "3 days ago", "in 2 months"
 */
export function fmtAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr  = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffMo  = Math.round(diffDay / 30.44);
  const diffYr  = Math.round(diffDay / 365.25);

  const past = diffMs >= 0;
  const abs = Math.abs;

  if (abs(diffSec) < 60) return 'just now';
  if (abs(diffMin) < 60) return past ? `${abs(diffMin)}m ago` : `in ${abs(diffMin)}m`;
  if (abs(diffHr)  < 24) return past ? `${abs(diffHr)}h ago` : `in ${abs(diffHr)}h`;
  if (abs(diffDay) < 30) return past ? `${abs(diffDay)} days ago` : `in ${abs(diffDay)} days`;
  if (abs(diffMo)  < 12) return past ? `${abs(diffMo)} months ago` : `in ${abs(diffMo)} months`;
  return past ? `${abs(diffYr)} years ago` : `in ${abs(diffYr)} years`;
}

/* ── Financial year ─────────────────────────────────────────────────── */

/** Indian financial year label: FY25-26 */
export function fyOf(d: Date): string {
  const year = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  return `FY${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
}

/** Whether a date falls within a given financial year */
export function isInFY(d: Date, fy: number): boolean {
  const start = new Date(fy, 3, 1);        // April 1
  const end   = new Date(fy + 1, 2, 31);   // March 31
  return d >= start && d <= end;
}
