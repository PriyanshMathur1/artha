export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export type RalphIntent = 'stock' | 'mf' | 'portfolio' | 'compare' | 'general';

export type CompareKind = 'stock' | 'mf';

export interface RalphRequest {
  turns: ChatTurn[];
  userId?: string | null;
}

export interface AgentFinding {
  agent: string;
  summary: string;
  /** 0–10 if the agent emits a score; undefined for narrative-only findings. */
  score?: number;
  /** Optional verdict label (e.g. "Strong Buy", "Hold"). */
  verdict?: string;
  evidence?: string[];
  warnings?: string[];
  data?: Record<string, unknown>;
}

export interface RalphResponse {
  answer: string;
  why: string[];
  assumptions?: string[];
  nextSteps?: string[];
  agents: AgentFinding[];
  meta: {
    intent: RalphIntent;
    ticker?: string;
    schemeCode?: string;
    compareKind?: CompareKind;
    compareLeft?: string;
    compareRight?: string;
    latencyMs: number;
    tokenUsage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  };
}

