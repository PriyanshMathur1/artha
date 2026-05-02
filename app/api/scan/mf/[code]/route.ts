import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { runMFScan } from '@/lib/agents/mf/index';
import { db } from '@/lib/db';
import type { CompositeResult } from '@/lib/agents/shared/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Next.js 15: params is a Promise
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;

  let overrides: Parameters<typeof runMFScan>[1] | undefined;
  let categoryStats: Parameters<typeof runMFScan>[2] | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    overrides = body.overrides;
    categoryStats = body.categoryStats;
  } catch {
    // No body is fine
  }

  let result: CompositeResult;
  try {
    result = await runMFScan(code, overrides, categoryStats);
  } catch (err) {
    console.error(`[scan/mf] ${code}`, err);
    return NextResponse.json({ error: 'Scan failed', detail: String(err) }, { status: 500 });
  }

  void persistScanRun(user.id, code, result);

  return NextResponse.json(result);
}

async function persistScanRun(userId: string, symbol: string, result: CompositeResult) {
  try {
    await db.scanRun.create({
      data: {
        userId,
        assetType: 'MF',
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
            signals: JSON.parse(JSON.stringify(a.signals ?? {})),
          })),
        },
      },
    });
  } catch (err) {
    console.warn('[scan/mf] persist failed', err);
  }
}
