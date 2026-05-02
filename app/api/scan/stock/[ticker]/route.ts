import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { runStockScan } from '@/lib/agents/stock/index';
import { db } from '@/lib/db';
import type { CompositeResult } from '@/lib/agents/shared/types';

export const dynamic = 'force-dynamic';
// Deep scan can take a few seconds — extend serverless timeout
export const maxDuration = 30;

export async function POST(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticker = params.ticker.toUpperCase();

  let result: CompositeResult;
  try {
    result = await runStockScan(ticker);
  } catch (err) {
    console.error(`[scan/stock] ${ticker}`, err);
    return NextResponse.json({ error: 'Scan failed', detail: String(err) }, { status: 500 });
  }

  // Persist scan run asynchronously (don't block the response)
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
        verdict: result.verdict as never,  // Prisma enum — matches after `prisma generate`
        rationale: result.rationale,
        agentScores: {
          create: result.agentResults.map((a) => ({
            agentName: a.agentName,
            score: a.score,
            weight: 1 / result.agentResults.length, // fallback; agents don't expose weight in result
            rationale: a.rationale,
            signals: a.signals ?? {},
          })),
        },
      },
    });
    return scanRun;
  } catch (err) {
    // Non-critical — scan result already returned to client
    console.warn('[scan/stock] persist failed', err);
  }
}
