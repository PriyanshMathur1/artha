// Native-Date implementations so we don't depend on date-fns (the package
// isn't installed and these helpers are unused — leaving them stubbed in
// case future code wants them).

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Minimal date formatter. Supported tokens: dd, MM, MMM, yyyy.
 * Default: "dd MMM yyyy" → "02 May 2026".
 */
export function fmtDate(d: Date | string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!d) return '—';
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const MMM = MONTHS_SHORT[date.getMonth()];
  const yyyy = String(date.getFullYear());
  return fmt
    .replace('yyyy', yyyy)
    .replace('MMM', MMM)
    .replace('MM', MM)
    .replace('dd', dd);
}

/** Returns a human relative time like "3 days ago" / "2 hours ago". */
export function fmtAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} days ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} months ago`;
  const yr = Math.round(mo / 12);
  return `${yr} yr ago`;
}

/** Indian financial year: April 1 - March 31. */
export function fyOf(d: Date): string {
  const year = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  return `FY${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
}
