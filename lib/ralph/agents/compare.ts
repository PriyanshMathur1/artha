import { runStockAgents } from './stock';
import { runMFAgent } from './mf';
import type { AgentFinding, CompareKind } from '../types';

export interface CompareResult {
  finding: AgentFinding;
  /** Per-side findings so the orchestrator can render them as their own cards. */
  perSide: AgentFinding[];
  left: string;
  right: string;
  winner: 'left' | 'right' | 'tie';
}

interface SideScore {
  label: string;
  score: number;
  verdict: string;
  evidence: string[];
  finding: AgentFinding;
}

async function scoreStockSide(ticker: string): Promise<SideScore> {
  try {
    const { findings, composite } = await runStockAgents(ticker);
    const fundamental = findings.find((f) => f.agent === 'Fundamental');
    const moat = findings.find((f) => f.agent === 'Moat');
    const evidence = [
      `Composite ${composite.score.toFixed(1)}/10 — ${composite.verdict}`,
      fundamental?.summary ?? '',
      moat?.summary ?? '',
    ].filter(Boolean);

    return {
      label: ticker,
      score: composite.score,
      verdict: composite.verdict,
      evidence,
      finding: {
        agent: `Stock · ${ticker}`,
        summary: `${ticker}: composite ${composite.score.toFixed(1)}/10 — ${composite.verdict}`,
        score: composite.score,
        verdict: composite.verdict,
        evidence,
        data: { ticker, composite, findings },
      },
    };
  } catch (err) {
    return {
      label: ticker,
      score: 0,
      verdict: 'Unavailable',
      evidence: [`Could not load ${ticker}: ${err instanceof Error ? err.message : 'unknown error'}`],
      finding: {
        agent: `Stock · ${ticker}`,
        summary: `${ticker}: data unavailable`,
        evidence: [`Could not load ${ticker}.`],
      },
    };
  }
}

async function scoreMFSide(query: string): Promise<SideScore> {
  const res = await runMFAgent(query);
  const score = res.finding.score ?? 0;
  return {
    label: res.schemeName ?? query,
    score,
    verdict: res.finding.verdict ?? 'Unrated',
    evidence: res.finding.evidence ?? [],
    finding: res.finding,
  };
}

export async function runCompareAgent(
  left: string,
  right: string,
  kind: CompareKind,
): Promise<CompareResult> {
  const [a, b] = await Promise.all(
    kind === 'stock'
      ? [scoreStockSide(left), scoreStockSide(right)]
      : [scoreMFSide(left), scoreMFSide(right)],
  );

  const gap = +(a.score - b.score).toFixed(1);
  let winner: 'left' | 'right' | 'tie';
  let summary: string;

  if (Math.abs(gap) < 0.3) {
    winner = 'tie';
    summary = `${a.label} vs ${b.label}: too close to call (${a.score.toFixed(1)} vs ${b.score.toFixed(1)}). Decide on personal fit, not score.`;
  } else if (gap > 0) {
    winner = 'left';
    summary = `${a.label} edges out ${b.label} (${a.score.toFixed(1)} vs ${b.score.toFixed(1)}, gap ${gap.toFixed(1)}). Verdict: ${a.verdict}.`;
  } else {
    winner = 'right';
    summary = `${b.label} edges out ${a.label} (${b.score.toFixed(1)} vs ${a.score.toFixed(1)}, gap ${Math.abs(gap).toFixed(1)}). Verdict: ${b.verdict}.`;
  }

  const evidence: string[] = [
    `${a.label}: score ${a.score.toFixed(1)}/10 — ${a.verdict}`,
    `${b.label}: score ${b.score.toFixed(1)}/10 — ${b.verdict}`,
  ];
  if (a.evidence[0]) evidence.push(`${a.label} highlight: ${a.evidence[0]}`);
  if (b.evidence[0]) evidence.push(`${b.label} highlight: ${b.evidence[0]}`);

  return {
    left: a.label,
    right: b.label,
    winner,
    perSide: [a.finding, b.finding],
    finding: {
      agent: 'Compare',
      summary,
      score: Math.max(a.score, b.score),
      verdict: winner === 'tie' ? 'Tie' : `${winner === 'left' ? a.label : b.label} wins`,
      evidence,
      data: {
        left: { label: a.label, score: a.score, verdict: a.verdict },
        right: { label: b.label, score: b.score, verdict: b.verdict },
        gap,
        kind,
      },
    },
  };
}
