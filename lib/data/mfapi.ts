/**
 * MFAPI.in client — free, no auth, public NAV data for all Indian MFs.
 * Endpoints:
 *   GET https://api.mfapi.in/mf            → list of all schemes
 *   GET https://api.mfapi.in/mf/{code}     → metadata + full NAV history
 *   GET https://api.mfapi.in/mf/{code}/latest → latest NAV only
 */

import { cached, TTL } from '@/lib/cache';

const BASE = 'https://api.mfapi.in/mf';

export interface MFSchemeMeta {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  isin?: string;
}

export interface MFNavPoint {
  date: Date;
  nav: number;
}

export interface MFSchemeFull extends MFSchemeMeta {
  nav: MFNavPoint[];
}

export async function getAllSchemes(): Promise<{ schemeCode: number; schemeName: string }[]> {
  return cached('mf:all', TTL.MF_HISTORY * 7, async () => {
    const res = await fetch(BASE, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((d: any) => ({
          schemeCode: Number(d.schemeCode),
          schemeName: String(d.schemeName),
        }))
      : [];
  });
}

export async function getScheme(code: number | string): Promise<MFSchemeFull | null> {
  return cached(`mf:${code}`, TTL.MF_HISTORY, async () => {
    try {
      const res = await fetch(`${BASE}/${code}`, { next: { revalidate: 21600 } });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.meta) return null;
      const navHistory: MFNavPoint[] = (data.data ?? [])
        .map((p: any) => ({
          date: parseDate(p.date),
          nav: Number(p.nav),
        }))
        .filter((p: MFNavPoint) => Number.isFinite(p.nav) && p.nav > 0)
        .sort((a: MFNavPoint, b: MFNavPoint) => a.date.getTime() - b.date.getTime());

      return {
        schemeCode: Number(data.meta.scheme_code),
        schemeName: String(data.meta.scheme_name),
        fundHouse: String(data.meta.fund_house),
        schemeType: String(data.meta.scheme_type),
        schemeCategory: String(data.meta.scheme_category),
        isin: data.meta.isin_growth ?? data.meta.isin_div_payout,
        nav: navHistory,
      };
    } catch (err) {
      console.warn(`[mfapi] scheme(${code}) failed`, err);
      return null;
    }
  });
}

export async function getLatestNav(code: number | string): Promise<MFNavPoint | null> {
  return cached(`mf:latest:${code}`, TTL.MF_NAV, async () => {
    try {
      const res = await fetch(`${BASE}/${code}/latest`, { next: { revalidate: 21600 } });
      if (!res.ok) return null;
      const data = await res.json();
      const point = data?.data?.[0];
      if (!point) return null;
      return { date: parseDate(point.date), nav: Number(point.nav) };
    } catch (err) {
      console.warn(`[mfapi] latest(${code}) failed`, err);
      return null;
    }
  });
}

/** MFAPI returns dates as "DD-MM-YYYY". */
function parseDate(s: string): Date {
  const [d, m, y] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Trailing returns from a NAV series, anchored at "today" (last NAV). */
export function trailingReturns(navs: MFNavPoint[]): {
  ret1y: number | null;
  ret3y: number | null;
  ret5y: number | null;
} {
  if (navs.length < 2) return { ret1y: null, ret3y: null, ret5y: null };
  const last = navs[navs.length - 1];

  const findOnOrBefore = (d: Date) => {
    for (let i = navs.length - 1; i >= 0; i--) {
      if (navs[i].date.getTime() <= d.getTime()) return navs[i];
    }
    return null;
  };

  const ago = (years: number) => {
    const d = new Date(last.date);
    d.setFullYear(d.getFullYear() - years);
    return d;
  };

  const calc = (years: number): number | null => {
    const past = findOnOrBefore(ago(years));
    if (!past) return null;
    const cagr = Math.pow(last.nav / past.nav, 1 / years) - 1;
    return cagr * 100;
  };

  return { ret1y: calc(1), ret3y: calc(3), ret5y: calc(5) };
}

/** Daily log returns — used by the risk-adjusted agent. */
export function dailyReturns(navs: MFNavPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < navs.length; i++) {
    out.push(Math.log(navs[i].nav / navs[i - 1].nav));
  }
  return out;
}
