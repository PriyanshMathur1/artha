/**
 * Yahoo Finance data layer for NSE stocks.
 *
 * Architecture:
 *   - getQuote: uses yahoo-finance2 library (handles cookies/crumb automatically)
 *   - getFundamentals: direct Yahoo Finance v10 quoteSummary API
 *   - getHistory: direct Yahoo Finance v8 chart API
 *
 * Why direct fetch for fundamentals/history?
 *   yahoo-finance2 v2.14 only ships `quote` and `autoc` modules in its ESM build.
 *   Rather than depend on an unofficial wrapper for all methods, we call the public
 *   Yahoo Finance JSON endpoints directly — same data, no extra dep surface.
 *
 * NSE symbols require the .NS suffix (e.g. RELIANCE.NS).
 */

// yahoo-finance2's default export types declare `quote` with a `ModuleThis` constraint
// that the compiled default import doesn't satisfy. The runtime call works correctly;
// the cast to `unknown` suppresses the false-positive type error.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import yahooFinance from 'yahoo-finance2';
const yf = yahooFinance as unknown as { quote: (symbol: string) => Promise<Record<string, unknown> | null> };
import { cached, TTL } from '@/lib/cache';

/* ── Types ──────────────────────────────────────────────────────────── */

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  marketCap?: number;
  asOf: Date;
}

export interface Fundamentals {
  symbol: string;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  eps: number | null;
  bookValue: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  beta: number | null;
  debtToEquity: number | null;
  netMargin: number | null;
  fetchedAt: Date;
}

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

const nse = (sym: string) => (sym.endsWith('.NS') ? sym : `${sym}.NS`);

/** Yahoo Finance base URLs — use v7/v8/v10 public endpoints */
const YF_BASE = 'https://query1.finance.yahoo.com';

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Artha/1.0)',
  Accept: 'application/json',
};

/* ── getQuote ───────────────────────────────────────────────────────── */

export async function getQuote(symbol: string): Promise<Quote | null> {
  return cached(`quote:${symbol}`, TTL.STOCK_QUOTE, async () => {
    try {
      // yahoo-finance2 handles the crumb/cookie flow automatically for `quote`
      const raw = await yf.quote(nse(symbol));
      if (!raw) return null;
      const q = raw as Record<string, number | undefined>;
      if (!q['regularMarketPrice']) return null;
      return {
        symbol,
        price:     q['regularMarketPrice']!,
        change:    q['regularMarketChange']    ?? 0,
        changePct: q['regularMarketChangePercent'] ?? 0,
        open:      q['regularMarketOpen'],
        high:      q['regularMarketDayHigh'],
        low:       q['regularMarketDayLow'],
        volume:    q['regularMarketVolume'],
        marketCap: q['marketCap'],
        asOf: new Date(),
      };
    } catch (err) {
      console.warn(`[yahoo] quote(${symbol}) failed`, err);
      return null;
    }
  });
}

/* ── getFundamentals ────────────────────────────────────────────────── */

export async function getFundamentals(symbol: string): Promise<Fundamentals | null> {
  return cached(`fund:${symbol}`, TTL.STOCK_FUNDAMENTALS, async () => {
    try {
      const url =
        `${YF_BASE}/v10/finance/quoteSummary/${nse(symbol)}` +
        `?modules=summaryDetail%2CdefaultKeyStatistics%2CfinancialData%2Cprice`;

      const res = await fetch(url, {
        headers: YF_HEADERS,
        next: { revalidate: TTL.STOCK_FUNDAMENTALS },
      });
      if (!res.ok) return null;

      const json = (await res.json()) as {
        quoteSummary?: {
          result?: Array<{
            summaryDetail?: Record<string, number | null>;
            defaultKeyStatistics?: Record<string, number | null>;
            financialData?: Record<string, number | null>;
            price?: Record<string, number | null>;
          }>;
          error?: unknown;
        };
      };

      const result = json.quoteSummary?.result?.[0];
      if (!result) return null;

      const detail = result.summaryDetail ?? {};
      const stats  = result.defaultKeyStatistics ?? {};
      const fin    = result.financialData ?? {};
      const price  = result.price ?? {};

      return {
        symbol,
        pe:            num(detail.trailingPE),
        pb:            num(stats.priceToBook),
        roe:           num(fin.returnOnEquity, 100),
        eps:           num(stats.trailingEps),
        bookValue:     num(stats.bookValue),
        dividendYield: num(detail.dividendYield, 100),
        marketCap:     num(price.marketCap),
        beta:          num(stats.beta),
        debtToEquity:  num(fin.debtToEquity),
        netMargin:     num(fin.profitMargins, 100),
        fetchedAt: new Date(),
      };
    } catch (err) {
      console.warn(`[yahoo] fundamentals(${symbol}) failed`, err);
      return null;
    }
  });
}

/* ── getHistory ─────────────────────────────────────────────────────── */

export async function getHistory(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1y',
): Promise<Candle[]> {
  return cached(`hist:${symbol}:${period}`, TTL.STOCK_QUOTE * 5, async () => {
    try {
      const interval = period === '5y' ? '1wk' : '1d';
      const url =
        `${YF_BASE}/v8/finance/chart/${nse(symbol)}` +
        `?interval=${interval}&range=${period}`;

      const res = await fetch(url, {
        headers: YF_HEADERS,
        next: { revalidate: TTL.STOCK_QUOTE * 5 },
      });
      if (!res.ok) return [];

      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            indicators?: {
              quote?: Array<{
                open?: (number | null)[];
                high?: (number | null)[];
                low?: (number | null)[];
                close?: (number | null)[];
                volume?: (number | null)[];
              }>;
            };
          }>;
        };
      };

      const result = json.chart?.result?.[0];
      if (!result) return [];

      const timestamps = result.timestamp ?? [];
      const ohlcv = result.indicators?.quote?.[0] ?? {};

      return timestamps
        .map((ts, i) => ({
          date:   new Date(ts * 1000),
          open:   ohlcv.open?.[i] ?? 0,
          high:   ohlcv.high?.[i] ?? 0,
          low:    ohlcv.low?.[i]  ?? 0,
          close:  ohlcv.close?.[i] ?? 0,
          volume: ohlcv.volume?.[i] ?? 0,
        }))
        .filter((c) => c.close > 0);
    } catch (err) {
      console.warn(`[yahoo] history(${symbol}) failed`, err);
      return [];
    }
  });
}

/* ── Utility ────────────────────────────────────────────────────────── */

/** Safely extract a number; optionally multiply (e.g. 0.12 → 12 for percentages). */
function num(v: number | null | undefined, multiply = 1): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return v * multiply;
}
