import { compose } from '@/lib/agents/shared/composer';
import type { CompositeResult, Agent } from '@/lib/agents/shared/types';
import { getQuote, getFundamentals, getHistory } from '@/lib/data/yahoo';
import { NIFTY_50_SEED } from '@/lib/data/universe';
import type { StockInput } from './types';

import { fundamentalAgent } from './fundamental/agent';
import { moatAgent } from './moat/agent';
import { technicalAgent } from './technical/agent';
import { growthAgent } from './growth/agent';
import { riskAgent } from './risk/agent';
import { sentimentAgent } from './sentiment/agent';

export const STOCK_AGENTS = [
  fundamentalAgent,
  moatAgent,
  technicalAgent,
  growthAgent,
  riskAgent,
  sentimentAgent,
] as const;

/** Validate weights sum to ~1.0 — guards against silent re-balance bugs. */
{
  const sum = STOCK_AGENTS.reduce((s, a) => s + a.weight, 0);
  if (Math.abs(sum - 1) > 0.01) {
    console.warn(`[stock-agents] weights sum to ${sum.toFixed(2)}, expected 1.0`);
  }
}

/** Assemble StockInput by fetching all required data in parallel. */
export async function buildStockInput(symbol: string): Promise<StockInput> {
  const meta = NIFTY_50_SEED.find((e) => e.symbol === symbol) ?? null;
  const [quote, fundamentals, history] = await Promise.all([
    getQuote(symbol),
    getFundamentals(symbol),
    getHistory(symbol, '1y'),
  ]);
  return { symbol, meta, quote, fundamentals, history };
}

export async function runStockScan(symbol: string): Promise<CompositeResult> {
  const input = await buildStockInput(symbol);
  return compose([...STOCK_AGENTS] as unknown as Agent<StockInput>[], input);
}

export type { StockInput };
