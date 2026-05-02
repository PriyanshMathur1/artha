import type { Agent } from '@/lib/agents/shared/types';
import { clamp } from '@/lib/utils/money';
import type { StockInput } from '../types';

interface SentimentSignals {
  shortMomentum: number;     // 1-month return %
  mediumMomentum: number;    // 6-month return %
  trend: 'positive' | 'mixed' | 'negative';
  note: string;
}

/**
 * Sentiment agent — v1 uses price-momentum proxy (since news/social aren't ingested yet).
 * v2 should plug in:
 *   - Analyst recommendation count + skew (from quoteSummary recommendationTrend)
 *   - News headlines (Yahoo news endpoint or RSS) → simple positive/negative classifier
 *   - Promoter buy/sell from BSE bulk-deal disclosures
 */
export const sentimentAgent: Agent<StockInput, SentimentSignals> = {
  name: 'sentiment',
  description: 'Market mood — momentum, news, analyst skew',
  weight: 0.05,

  async run(input) {
    const candles = input.history;
    const closes = candles.map((c) => c.close);
    const last = closes[closes.length - 1];
    const monthAgo = closes[Math.max(0, closes.length - 21)];
    const sixMonthAgo = closes[Math.max(0, closes.length - 126)];

    const shortMomentum = monthAgo ? ((last - monthAgo) / monthAgo) * 100 : 0;
    const mediumMomentum = sixMonthAgo ? ((last - sixMonthAgo) / sixMonthAgo) * 100 : 0;

    // Both positive → positive sentiment, both negative → negative, mixed otherwise
    const trend: SentimentSignals['trend'] =
      shortMomentum > 2 && mediumMomentum > 5 ? 'positive'
      : shortMomentum < -2 && mediumMomentum < -5 ? 'negative'
      : 'mixed';

    // Convert into 0-10 score with mid-band sweet spot
    const score = clamp(
      5 + (shortMomentum * 0.05) + (mediumMomentum * 0.04),
      0,
      10,
    );

    return {
      agentName: 'sentiment',
      score: Number(score.toFixed(2)),
      rationale: `${trend === 'positive' ? 'Constructive' : trend === 'negative' ? 'Cautious' : 'Mixed'} mood — 1m ${shortMomentum.toFixed(1)}%, 6m ${mediumMomentum.toFixed(1)}%.`,
      signals: {
        shortMomentum,
        mediumMomentum,
        trend,
        note: 'Price momentum proxy — wire news + analyst data in v2.',
      },
      confidence: closes.length >= 126 ? 0.7 : 0.4,
    };
  },
};
