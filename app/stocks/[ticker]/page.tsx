'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VerdictBadge } from '@/components/ui/VerdictBadge';
import { AgentBreakdown } from '@/components/ui/AgentBreakdown';
import type { CompositeResult } from '@/lib/agents/shared/types';

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const [result, setResult] = useState<CompositeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/stock/${ticker}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CompositeResult;
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
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{ticker}</h1>
            <p className="mt-1 text-sm text-slate-500">Stock deep-scan · 6 agents</p>
          </div>
          {result && (
            <VerdictBadge verdict={result.verdict} size="lg" />
          )}
        </div>

        {/* Scan trigger */}
        {!result && (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-4xl">🔍</div>
            <h2 className="font-semibold text-slate-900">Run AI Deep Scan</h2>
            <p className="max-w-sm text-sm text-slate-500">
              Six agents analyse fundamentals, moat, technicals, growth, risk, and market
              sentiment — then combine into a single conviction score.
            </p>
            <Button onClick={runScan} loading={loading} size="lg">
              {loading ? 'Scanning…' : `Scan ${ticker}`}
            </Button>
            {error && (
              <p className="text-sm text-red-600">Error: {error}</p>
            )}
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Composite + rationale */}
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

            {/* Agent breakdown */}
            <Card>
              <CardHeader
                heading="Agent Breakdown"
                description="Click any agent to see its signals and rationale"
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
