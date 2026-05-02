import type { Agent, AgentResult, CompositeResult } from './types';
import { compositeToVerdict } from './verdict';

/**
 * Run all agents in parallel for a given input, then weight + compose.
 * Confidence-weighted: an agent with weight 0.3 but confidence 0.5 contributes 0.15.
 * Weights are renormalized so missing-data agents don't tank the composite.
 */
export async function compose<TInput>(
  agents: Agent<TInput>[],
  input: TInput,
): Promise<CompositeResult> {
  const settled = await Promise.allSettled(agents.map((a) => a.run(input)));
  const agentResults: AgentResult[] = [];

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === 'fulfilled') {
      agentResults.push(r.value);
    } else {
      agentResults.push({
        agentName: agents[i].name,
        score: 5,
        rationale: `Agent failed: ${String(r.reason).slice(0, 200)}`,
        signals: {},
        confidence: 0,
        flags: ['agent-failed'],
      });
    }
  }

  // Effective weight = declared weight × confidence
  let totalEffective = 0;
  let weighted = 0;
  agentResults.forEach((res, i) => {
    const declared = agents[i].weight;
    const confidence = res.confidence ?? 1;
    const effective = declared * confidence;
    totalEffective += effective;
    weighted += effective * res.score;
  });

  const composite = totalEffective > 0
    ? Number((weighted / totalEffective).toFixed(2))
    : 5;

  const verdict = compositeToVerdict(composite);
  const rationale = generateCompositeRationale(agentResults, verdict);

  return {
    composite,
    verdict,
    rationale,
    agentResults,
    generatedAt: new Date(),
  };
}

function generateCompositeRationale(results: AgentResult[], verdict: string): string {
  // Pick top 2 strongest and weakest agents for the headline rationale
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2).filter((a) => a.score >= 6);
  const weaknesses = sorted.slice(-2).filter((a) => a.score < 5);

  const parts: string[] = [];
  if (strengths.length) {
    parts.push(`Strong on ${strengths.map((s) => s.agentName).join(' & ')}`);
  }
  if (weaknesses.length) {
    parts.push(`weak on ${weaknesses.map((w) => w.agentName).join(' & ')}`);
  }
  return parts.length ? `${parts.join('; ')}. Verdict: ${verdict.replace('_', ' ')}.` : `Verdict: ${verdict.replace('_', ' ')}.`;
}
