export interface AgentResult {
  agentName: string;
  score: number;
  confidence?: number;
  rationale: string;
  flags?: string[];
  signals?: Record<string, unknown>;
}
