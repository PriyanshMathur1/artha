'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VerdictBadge } from '@/components/ui/VerdictBadge';
import { AgentBreakdown } from '@/components/ui/AgentBreakdown';
import { Badge } from '@/components/ui/Badge';
import type { CompositeResult } from '@/lib/agents/shared/types';

interface MFMeta {
  schemeName: string;
  fundHouse: string;
  schemeCategory: string;
  nav: number | null;
}

export default function MFDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [meta, setMeta] = useState<MFMeta | null>(null);
  const [result, setResult] = useState<CompositeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      // Fetch MF metadata and scan in parallel
      const [metaRes, scanRes] = await Promise.all([
        fetch(`/api/mf/${code}`),
        fetch(`/api/scan/mf/${code}`, { method: 'POST' }),
      ]);

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData as MFMeta);
      }

      if (!scanRes.ok) throw new Error(`Scan failed: HTTP ${scanRes.status}`);
      const data = (await scanRes.json()) as CompositeResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-xs text-slate-400">Scheme #{code}</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {meta?.schemeName ?? 'Mutual Fund Deep Scan'}
            </h1>
            {meta && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">{meta.fundHouse}</span>
                <Badge variant="neutral">{meta.schemeCategory}</Badge>
              </div>
            )}
          </div>
          {result && <VerdictBadge verdict={result.verdict} size="lg" />}
        </div>

        {/* Trigger */}
        {!result && (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-4xl">🧠</div>
            <h2 className="font-semibold text-slate-900">Run AI Deep Scan</h2>
            <p className="max-w-sm text-sm text-slate-500">
              Six specialised agents analyse manager quality, expense drag, style drift,
              risk-adjusted returns, consistency, and tax efficiency — then blend into a
              conviction score.
            </p>
            <Button onClick={runScan} loading={loading} size="lg">
              {loading ? 'Scanning…' : `Scan fund #${code}`}
            </Button>
            {error && <p className="text-sm text-red-600">Error: {error}</p>}
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            <Card>
              <CardHeader
                heading="Composite Analysis"
                description={`Generated ${new Date(result.generatedAt).toLocaleString('en-IN')}`}
                action={
                  <Button variant="secondary" size="sm" onClick={runScan} loading={loading}>
                    Re-scan
                  </Button>
                }
              />
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.rationale}</p>
            </Card>

            <Card>
              <CardHeader
                heading="Agent Breakdown"
                description="6 agents · confidence-weighted composite"
              />
              <div className="mt-4">
                <AgentBreakdown
                  agentResults={result.agentResults}
                  composite={result.composite}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </Shell>
  );
}
