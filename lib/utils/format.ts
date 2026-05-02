import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function fmtDate(d: Date | string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, fmt);
}

export function fmtAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Indian financial year: April 1 - March 31. */
export function fyOf(d: Date): string {
  const year = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  return `FY${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
}
