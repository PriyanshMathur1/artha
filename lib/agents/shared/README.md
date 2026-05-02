# Agent framework

Every asset class plugs into the same multi-agent shape. This folder owns the contract.

## Files

- `types.ts` — `Agent`, `AgentResult`, `CompositeResult`, `Verdict`
- `composer.ts` — runs agents in parallel, confidence-weights scores, emits a composite + verdict
- `verdict.ts` — score → verdict mapping + Tailwind color classes

## Pattern

```ts
import type { Agent } from '@/lib/agents/shared/types';

export const myAgent: Agent<MyInput, MySignals> = {
  name: 'my-agent',
  description: 'What this agent measures',
  weight: 0.2,
  async run(input) {
    const signals = computeSignals(input);
    const score = mapToScore(signals);
    return {
      agentName: 'my-agent',
      score,
      rationale: `One-sentence why-this-score.`,
      signals,
      confidence: 1,
    };
  },
};
```

## Confidence weighting

If an agent has `confidence: 0.5`, its contribution to the composite is halved and the remaining weight is redistributed across the other agents. This prevents missing data from killing scores.

## Adding a new asset class

1. Create `lib/agents/<asset>/<agent>/agent.ts` exporting an Agent.
2. Aggregate them in `lib/agents/<asset>/index.ts`.
3. Call `compose(agents, input)` from your scan endpoint.

That's it. The composer doesn't care what the asset class is.
