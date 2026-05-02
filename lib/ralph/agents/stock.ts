/**
 * Stock specialist for Ralph.
 *
 * Wraps the existing 6-agent stock engine under `lib/agents/*` and returns
 * `AgentFinding[]` shapes that the chat UI can render. The 6 agents run
 * concurrently — three of them (technical, sentiment, risk) need the live
 * quote/history, so the network calls (`getQuote`, `getSummary`, `getHistory`)
 * are issued first.
 *
 * The composite weighting (30/25/20/10/10/5) matches the public Deep Scan
 * page so verdicts are consistent across surfaces. Don't change weights here
 * without updating `app/stock/[ticker]/page.tsx`.
 */

import { getQuote, getSummary, getHistory } from '@/lib/angelone';
import { fundamentalAgent } from '@/lib/agents/fundamental';
import { technicalAgent } from '@/lib/agents/technical';
import { sentimentAgent } from '@/lib/agents/sentiment';
import { moatAgent } from '@/lib/agents/moat';
import { growthAgent } from '@/lib/agents/growth';
import { riskAgent } from '@/lib/agents/risk';

import type { AgentFinding } from '../types';

/**
 * Run all 6 stock agents on a ticker and return their findings + a
 * composite verdict. Throws if Angel One / Yahoo can't resolve the ticker.
 */
export async function runStockAgents(ticker: string): Promise<{ findings: AgentFinding[]; composite: { score: number; verdict: string } }> {
  const [quote, summary, history] = await Promise.all([getQuote(ticker), getSummary(ticker), getHistory(ticker, '1y')]);

  const [fundamental, technical, sentiment, moat, growth, risk] = await Promise.all([
    Promise.resolve(fundamentalAgent(summary)),
    Promise.resolve(technicalAgent(history, quote.regularMarketPrice)),
    Promise.resolve(sentimentAgent(quote, summary)),
    Promise.resolve(moatAgent(summary)),
    Promise.resolve(growthAgent(summary, quote.regularMarketPrice)),
    Promise.resolve(riskAgent(quote, summary)),
  ]);

  const sentimentNorm = (sentiment.index + 100) / 20;
  const riskNorm = 10 - risk.score;
  const weighted =
    fundamental.score * 0.30 +
    technical.score * 0.20 +
    sentimentNorm * 0.05 +
    moat.score * 0.25 +
    Math.min(10, Math.max(0, growth.cagr.base / 3)) * 0.10 +
    riskNorm * 0.10;
  const compositeScore = Math.round(Math.min(10, Math.max(0, weighted)) * 10) / 10;

  const verdict =
    compositeScore >= 7.5 ? 'Strong Buy' :
    compositeScore >= 6 ? 'Buy' :
    compositeScore >= 4.5 ? 'Hold' :
    compositeScore >= 3 ? 'Caution' : 'Avoid';

  const findings: AgentFinding[] = [
    { agent: 'Fundamental', summary: `${fundamental.grade} (${fundamental.score.toFixed(1)}/10) — ${fundamental.valuationAssessment}`, evidence: [...fundamental.strengths], data: { fundamental } },
    { agent: 'Technical', summary: `${technical.grade} (${technical.score.toFixed(1)}/10) — ${technical.trendDirection} bias, RSI ${technical.rsi} (${technical.rsiSignal})`, evidence: [...technical.signals], data: { technical } },
    { agent: 'Moat', summary: `${moat.moatType} moat — durability: ${moat.durability}`, evidence: [...moat.indicators], data: { moat } },
    { agent: 'Growth', summary: `Base CAGR ${growth.cagr.base}% — bear/base/bull scenarios available`, evidence: [...growth.drivers], data: { growth } },
    { agent: 'Risk', summary: `${risk.grade} risk — ${risk.volatility} volatility, ${risk.liquidityRisk} liquidity`, evidence: [...risk.topRisks], data: { risk } },
    { agent: 'Sentiment', summary: `${sentiment.label} — rating: ${sentiment.analystRating}`, evidence: [...sentiment.signals], data: { sentiment } },
  ];

  return { findings, composite: { score: compositeScore, verdict } };
}

