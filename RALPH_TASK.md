---
task: Multi-agent chat for Artha Terminal (stock / MF / portfolio / compare)
test_command: "npx tsc --noEmit"
---

# Task: Ralph multi-agent chat

Ship a chat at `/chat` that routes a user prompt to the right specialist agent(s),
runs them in parallel, and returns a clean answer + a "why" + agent scorecards.

The chat extends the existing scaffold under `lib/ralph/` and reuses the per-stock
agents under `lib/agents/`, the MFAPI client at `lib/mfapi.ts`, and the rebalancer
at `lib/rebalancer.ts`.

## Architecture

```
            ┌──────────────────┐
 user ─────▶│  Router (intent) │
            └────────┬─────────┘
                     │
   ┌────────────┬────┴────┬──────────────┬──────────────┐
   ▼            ▼         ▼              ▼              ▼
 Stock        MF       Portfolio      Compare        General
(6 sub-      (NAV +   (P&L, sector,   (parallel       (LLM
 agents in    returns, rebalance       stock-vs-       fallback,
 parallel)    direction) hints)        stock or         answers
                                        MF-vs-MF)       small talk)
   │            │         │              │              │
   └────────────┴────┬────┴──────────────┴──────────────┘
                     ▼
              ┌──────────────┐
              │  Synthesizer │  → answer + why[] + nextSteps[] + agents[]
              └──────────────┘
```

## Success Criteria

### Foundation
- [x] `lib/ralph/types.ts` includes `mf` and `compare` intents
- [x] `lib/ralph/router.ts` detects MF queries (scheme name / "fund" / "SIP") and "X vs Y" comparisons
- [x] Router validates ticker candidates against `NSE_UNIVERSE` to reject false positives like "I" or "AND"

### Agents
- [x] `lib/ralph/agents/mf.ts` exports `runMFAgent(query)` — fuzzy-resolves a scheme,
      pulls latest NAV + trailing returns + direction from MFAPI, returns an `AgentFinding`
      with score 0–10, verdict, drivers, risks
- [x] `lib/ralph/agents/compare.ts` exports `runCompareAgent(a, b, kind)` — runs two
      stock or MF analyses concurrently and returns one comparison `AgentFinding`
      that names the better-on / worse-on dimensions
- [x] `lib/ralph/agents/portfolio.ts` returns live P&L (best-effort via getQuote /
      getCurrentNav), top 3 winners + losers, sector concentration, and rebalance
      hints (calls `runRebalance` defensively, degrades gracefully if Angel One token absent)

### Orchestrator
- [x] `lib/ralph/orchestrator.ts` dispatches `mf` and `compare` intents
- [x] All findings (stock sub-agents + portfolio + MF + compare + general) flow back
      to the API as `agents: AgentFinding[]`
- [x] Latency, intent, and ticker echoed in `meta`

### UI
- [x] `app/chat/page.tsx` renders agent scorecards under each assistant turn:
      ring score, agent name, summary, evidence bullets
- [x] "Why" bullets render as a collapsible block below the answer
- [x] "Next steps" render as suggestion chips the user can click to send

### Quality gate
- [x] `npx tsc --noEmit` passes for the changed files
- [x] Smoke prompts produce sensible output shape (verified by reading the
      orchestrator return value mentally for each intent — see `.ralph/progress.md`)

## Out of scope (don't do these in this task)
- Streaming responses (SSE)
- New DB models — reuse `ChatThread` + `ChatMessage`
- Replacing the existing stock 6-agent engine
- Adding new third-party data sources

## Definition of Done
All `[ ]` boxes above are `[x]`. Output `<ralph>COMPLETE</ralph>` once verified.
