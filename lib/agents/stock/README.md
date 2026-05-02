# Stock agents

Six dedicated agents, each in its own folder. Composer in `lib/agents/shared/composer.ts` runs them in parallel and produces a verdict.

| Agent | Folder | Weight |
| --- | --- | --- |
| Fundamental | `fundamental/` | 30% |
| Moat | `moat/` | 25% |
| Technical | `technical/` | 20% |
| Growth | `growth/` | 10% |
| Risk | `risk/` | 10% |
| Sentiment | `sentiment/` | 5% |

Weights sum to 100% — `index.ts` warns at startup if any change drifts the total.

## Running a scan

```ts
import { runStockScan } from '@/lib/agents/stock';

const result = await runStockScan('RELIANCE');
// { composite: 7.4, verdict: 'BUY', agentResults: [...], rationale: '...' }
```

The composer redistributes weight when an agent has low confidence (e.g., missing fundamentals), so a partial-data stock still gets a usable score.

## Adding a new agent

1. Create `<agent-name>/agent.ts` and (optional) `<agent-name>/signals.ts` for pure helpers.
2. Add a `<agent-name>/README.md` documenting what it scores.
3. Import and register in `index.ts` — adjust weights so the sum stays at 1.0.

That's the whole contract.
