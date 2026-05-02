# Progress

## Iteration 1 — initial scaffold + full build (2026-05-02)

Done:
- Surveyed existing `lib/ralph/*` (orchestrator, router, types, store, three agents).
- Surveyed `lib/agents/*` (fundamental/technical/moat/growth/risk/sentiment).
- Surveyed `lib/mfapi.ts` (NAV, trailing returns, direction).
- Surveyed `lib/rebalancer.ts` (RebalanceReport with summary/review/trim/add/sectorBreakdown).
- Surveyed `components/DeepDive/AgentScorecards.tsx` to model the chat scorecards after.
- Wrote `RALPH_TASK.md` with checkbox-driven success criteria.
- Wrote `.ralph/{guardrails.md, activity.log, errors.log, PROMPT.md}`.

Built in this iteration:
- `lib/ralph/types.ts` — added `mf` and `compare` intents; `score`, `verdict`, `warnings` on AgentFinding.
- `lib/ralph/agents/mf.ts` — fuzzy scheme resolver, NAV + trailing returns + direction, verdict 0–10.
- `lib/ralph/agents/compare.ts` — parallel two-side scoring, winner detection, per-side findings.
- `lib/ralph/agents/portfolio.ts` — live P&L (best-effort), sectors, winners/losers, concentration warnings, score.
- `lib/ralph/router.ts` — universe-validated tickers, MF detection, compare detection (fixed prefix-stripping bug).
- `lib/ralph/orchestrator.ts` — dispatches all 5 intents, returns AgentFinding[] + meta.
- `app/chat/page.tsx` — agent scorecards with score rings, collapsible "Why", clickable next-step suggestions, thread switcher.

Verified:
- `npx tsc --noEmit` is clean for every Ralph chat file (pre-existing errors elsewhere are out of scope).
- Router smoke test: 12/12 prompts route to expected intents (stock, MF, portfolio, compare both kinds, general).

Up next (future iterations, if needed):
- Fix the `lib/ralph/store.ts` implicit-any warnings (pre-existing, not part of this task).
- Consider streaming responses (SSE) for stock + compare paths.
- Add an "explain why this scheme matches" hint when fuzzy MF resolution picks the wrong plan.
- Wire the `/api/rebalance` deep call into the portfolio agent for users with Angel One configured.

`<ralph>COMPLETE</ralph>`
