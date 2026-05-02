import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { runStockScan } from '@/lib/agents/stock/index';
import { db } from '@/lib/db';
import type { CompositeResult } from '@/lib/agents/shared/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Next.js 15: params is a Promise
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  let result: CompositeResult;
  try {
    result = await runStockScan(ticker);
  } catch (err) {
    console.error(`[scan/stock] ${ticker}`, err);
    return NextResponse.json({ error: 'Scan failed', detail: String(err) }, { status: 500 });
  }

  void persistScanRun(user.id, ticker, result);

  return NextResponse.json(result);
}

async function persistScanRun(userId: string, symbol: string, result: CompositeResult) {
  try {
    const scanRun = await db.scanRun.create({
      data: {
        userId,
        assetType: 'STOCK',
        symbol,
        composite: result.composite,
        verdict: result.verdict as never,
        rationale: result.rationale,
        agentScores: {
          create: result.agentResults.map((a) => ({
            agentName: a.agentName,
            score: a.score,
            weight: 1 / result.agentResults.length,
            rationale: a.rationale,
            signals: a.signals ?? {},
          })),
        },
      },
    });
    return scanRun;
  } catch (err) {
    console.warn('[scan/stock] persist failed', err);
  }
}
