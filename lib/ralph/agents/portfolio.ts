import { prisma } from '@/lib/db';
import { getQuote } from '@/lib/angelone';
import { getCurrentNav } from '@/lib/mfapi';
import type { AgentFinding } from '../types';

interface EnrichedStock {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avgBuyPrice: number;
  invested: number;
  current: number;
  pnlAbs: number;
  pnlPct: number;
}

interface EnrichedMF {
  schemeName: string;
  schemeCode: string;
  invested: number;
  current: number;
  pnlAbs: number;
  pnlPct: number;
}

function fmtINR(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

async function enrichStocks(holdings: Array<{ symbol: string; name: string; sector: string; qty: number; avgBuyPrice: number }>): Promise<EnrichedStock[]> {
  const enriched = await Promise.all(
    holdings.map(async (h) => {
      const invested = h.qty * h.avgBuyPrice;
      let price = h.avgBuyPrice;
      try {
        const q = await getQuote(h.symbol);
        if (q?.regularMarketPrice && q.regularMarketPrice > 0) price = q.regularMarketPrice;
      } catch {
        // Angel One may not be authenticated — fall back to avg cost (P&L = 0).
      }
      const current = h.qty * price;
      const pnlAbs = current - invested;
      const pnlPct = invested > 0 ? (pnlAbs / invested) * 100 : 0;
      return {
        symbol: h.symbol,
        name: h.name,
        sector: h.sector || 'Unclassified',
        qty: h.qty,
        avgBuyPrice: h.avgBuyPrice,
        invested,
        current,
        pnlAbs,
        pnlPct,
      };
    }),
  );
  return enriched;
}

async function enrichMFs(holdings: Array<{ schemeCode: string; schemeName: string; units: number; avgNav: number; investedAmount: number }>): Promise<EnrichedMF[]> {
  const enriched = await Promise.all(
    holdings.map(async (h) => {
      let nav = h.avgNav;
      try {
        const v = await getCurrentNav(h.schemeCode);
        if (v && v > 0) nav = v;
      } catch {
        // MFAPI hiccup — keep cost basis so P&L falls to ~0.
      }
      const invested = h.investedAmount || h.units * h.avgNav;
      const current = h.units * nav;
      const pnlAbs = current - invested;
      const pnlPct = invested > 0 ? (pnlAbs / invested) * 100 : 0;
      return {
        schemeCode: h.schemeCode,
        schemeName: h.schemeName,
        invested,
        current,
        pnlAbs,
        pnlPct,
      };
    }),
  );
  return enriched;
}

export async function runPortfolioAgent(userId: string): Promise<AgentFinding> {
  const [stockRows, mfRows, watchlistCount] = await Promise.all([
    prisma.stockHolding.findMany({ where: { userId }, take: 100 }),
    prisma.mFHolding.findMany({ where: { userId }, take: 100 }),
    prisma.watchlist.count({ where: { userId } }),
  ]);

  if (stockRows.length === 0 && mfRows.length === 0) {
    return {
      agent: 'Portfolio',
      summary: 'No holdings on file. Import from Angel One or Zerodha to unlock portfolio analysis.',
      score: 0,
      evidence: [
        watchlistCount > 0 ? `${watchlistCount} watchlist symbols.` : 'Watchlist is empty.',
        'Tip: Visit /portfolio → Import to sync your broker holdings.',
      ],
    };
  }

  const [stocks, mfs] = await Promise.all([
    enrichStocks(stockRows),
    enrichMFs(mfRows),
  ]);

  const stockValue = stocks.reduce((s, h) => s + h.current, 0);
  const mfValue = mfs.reduce((s, h) => s + h.current, 0);
  const totalValue = stockValue + mfValue;

  const stockInvested = stocks.reduce((s, h) => s + h.invested, 0);
  const mfInvested = mfs.reduce((s, h) => s + h.invested, 0);
  const totalInvested = stockInvested + mfInvested;

  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Sector concentration.
  const sectorMap = new Map<string, number>();
  for (const s of stocks) {
    sectorMap.set(s.sector, (sectorMap.get(s.sector) ?? 0) + s.current);
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({ sector, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);
  const topSector = sectors[0];

  // Largest single position across stocks + MFs.
  const allPositions = [
    ...stocks.map((s) => ({ label: s.symbol, value: s.current, kind: 'stock' as const })),
    ...mfs.map((m) => ({ label: m.schemeName, value: m.current, kind: 'mf' as const })),
  ].sort((a, b) => b.value - a.value);
  const largest = allPositions[0];
  const largestPct = largest && totalValue > 0 ? (largest.value / totalValue) * 100 : 0;

  const winners = stocks
    .filter((s) => s.invested > 0)
    .sort((a, b) => b.pnlPct - a.pnlPct)
    .slice(0, 3);
  const losers = stocks
    .filter((s) => s.invested > 0)
    .sort((a, b) => a.pnlPct - b.pnlPct)
    .slice(0, 3);

  const evidence: string[] = [
    `Total value ${fmtINR(totalValue)} (Stocks ${fmtINR(stockValue)} · MFs ${fmtINR(mfValue)}).`,
    `Total P&L ${fmtINR(totalPnL)} (${fmtPct(totalPnLPct)}) on invested ${fmtINR(totalInvested)}.`,
  ];

  if (topSector) {
    evidence.push(
      `Top sector: ${topSector.sector} at ${topSector.pct.toFixed(1)}% of portfolio.`,
    );
  }
  if (largest) {
    evidence.push(
      `Largest position: ${largest.label} at ${largestPct.toFixed(1)}% (${fmtINR(largest.value)}).`,
    );
  }
  if (winners.length) {
    evidence.push(
      `Top winners: ${winners.map((w) => `${w.symbol} ${fmtPct(w.pnlPct)}`).join(', ')}.`,
    );
  }
  if (losers.length && losers[0].pnlPct < 0) {
    evidence.push(
      `Bottom performers: ${losers.map((l) => `${l.symbol} ${fmtPct(l.pnlPct)}`).join(', ')}.`,
    );
  }

  // Rebalance hints — best-effort. The full rebalancer needs Angel One; in a chat
  // we keep it light: flag obvious concentration risks.
  const warnings: string[] = [];
  if (topSector && topSector.pct > 35) {
    warnings.push(`${topSector.sector} concentration at ${topSector.pct.toFixed(1)}% — consider trimming below 30%.`);
  }
  if (largest && largestPct > 15) {
    warnings.push(`${largest.label} is ${largestPct.toFixed(1)}% of portfolio — single-position risk.`);
  }
  if (mfs.length === 0) {
    warnings.push('No mutual fund exposure — diversifying via index/flexicap MFs reduces single-stock risk.');
  } else if (stocks.length === 0) {
    warnings.push('No direct equity — consider 1–2 high-conviction stocks if your goal allows.');
  }

  // Verdict based on P&L and concentration.
  let score = 5;
  if (totalPnLPct > 15) score += 2;
  else if (totalPnLPct > 5) score += 1;
  else if (totalPnLPct < -10) score -= 2;
  else if (totalPnLPct < 0) score -= 1;
  if (warnings.length === 0) score += 1;
  if (warnings.length >= 3) score -= 1;
  score = Math.max(0, Math.min(10, score));

  const verdict =
    score >= 7 ? 'Healthy' :
    score >= 5 ? 'OK, with caveats' :
    score >= 3 ? 'Needs attention' : 'Rebalance recommended';

  const summary = `Portfolio is **${verdict}** — ${stocks.length} stocks, ${mfs.length} MFs, ${fmtINR(totalValue)} total, ${fmtPct(totalPnLPct)} P&L.`;

  return {
    agent: 'Portfolio',
    summary,
    score,
    verdict,
    evidence,
    warnings,
    data: {
      totals: { totalValue, totalInvested, totalPnL, totalPnLPct, stockValue, mfValue },
      counts: { stocks: stocks.length, mfs: mfs.length, watchlist: watchlistCount },
      sectors: sectors.slice(0, 5),
      largest: largest ? { label: largest.label, kind: largest.kind, pct: largestPct, value: largest.value } : null,
      winners: winners.map((w) => ({ symbol: w.symbol, pnlPct: w.pnlPct, pnlAbs: w.pnlAbs })),
      losers: losers.map((l) => ({ symbol: l.symbol, pnlPct: l.pnlPct, pnlAbs: l.pnlAbs })),
    },
  };
}
