/**
 * Agent contract shared across all asset classes.
 * Every agent is a small pure(-ish) module that:
 *   1. Takes a typed input
 *   2. Computes signals
 *   3. Maps signals → score (0-10)
 *   4. Generates a short rationale string
 *
 * The composer runs all agents in parallel, weights them, and emits a verdict.
 */

export interface AgentResult<TSignals = Record<string, unknown>> {
  agentName: string;
  score: number;          // 0-10
  rationale: string;
  signals: TSignals;
  confidence?: number;    // 0-1, how confident the agent is in its score (low when data missing)
  flags?: string[];       // e.g. ["pe-missing", "hist-too-short"]
}

export interface Agent<TInput, TSignals = Record<string, unknown>> {
  name: string;
  description: string;
  weight: number;         // 0..1; sum of weights across an asset class should be ~1
  run: (input: TInput) => Promise<AgentResult<TSignals>>;
}

export interface CompositeResult {
  composite: number;            // 0-10
  verdict: Verdict;
  rationale: string;
  agentResults: AgentResult[];
  generatedAt: Date;
}

export type Verdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'CAUTION' | 'AVOID';
