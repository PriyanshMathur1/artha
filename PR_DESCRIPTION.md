# feat(chat): Ralph multi-agent chat + floating "Ask AI" entry point

## What & why

Artha already had a single-agent chat scaffold under `lib/ralph/` and a navbar
"Chat" link, but the multi-agent surface area was thin and there was no easy
discovery path for users who didn't already know about `/chat`.

This PR turns `/chat` into a real **multi-agent assistant** — codenamed Ralph —
that handles four investor intents (specific stock, specific mutual fund, whole
portfolio, and head-to-head comparisons), and adds a floating **"Ask AI"** FAB
on every page so the feature is one click away.

## Architecture

```
                ┌──────────────────┐
   user ───────▶│  Router (intent) │
                └────────┬─────────┘
                         │
   ┌────────┬────────────┼────────────┬────────────┐
   ▼        ▼            ▼            ▼            ▼
 Stock     MF        Portfolio     Compare      General
 (6 sub-  (NAV +     (P&L,         (parallel    (LLM
  agents   trailing   sectors,      stock-vs-    fallback
  parallel) returns,   winners,     stock or     for small
            direction) rebalance    MF-vs-MF)    talk)
            )          hints)
   │        │            │            │            │
   └────────┴───────┬────┴────────────┴────────────┘
                    ▼
            ┌──────────────┐
            │  Synthesizer │  →  answer + why[] + nextSteps[] + agents[]
            └──────────────┘
                    ▼
              ┌──────────┐
              │  Chat UI │  bubble + score-ring agent cards + suggestion chips
              └──────────┘
```

## Highlights

- **Five intents, one entry point.** Router validates ticker candidates against
  `NSE_UNIVERSE` so "I", "AND", "MY" no longer get treated as tickers, and
  detects MF queries via name + AMC/keyword heuristics.
- **MF agent.** Fuzzy scheme resolver → MFAPI NAV + 1M/3M/6M/1Y trailing
  returns + 3-month direction → 0–10 verdict. Picks Direct Growth plans by
  default to dodge MFAPI's variant clutter.
- **Compare agent.** Runs two stock or MF analyses in parallel and returns
  one comparison card plus the per-side cards underneath.
- **Beefed-up portfolio agent.** Live P&L (best-effort via Angel One + MFAPI),
  sector concentration, top winners/losers, and concentration warnings.
  Degrades gracefully when the broker isn't connected.
- **Agent scorecards in the chat UI.** Score rings, collapsible "Why",
  clickable next-step chips, intent badge, latency display.
- **Floating "Ask AI" FAB.** Bottom-right on every page (hidden on `/chat`
  and auth pages), with a one-time amber pulse to draw attention on first load.
- **Ralph autonomous-iteration loop scaffolding** under `.ralph/` so a future
  agent (or you) can iterate on the chat without touching the prompt: read
  `RALPH_TASK.md`, follow `.ralph/PROMPT.md`, obey the Signs in
  `.ralph/guardrails.md`.

## Files changed

### New
- `components/AskAIFab.tsx` — floating "Ask AI" entry point
- `lib/ralph/agents/mf.ts` — mutual fund agent
- `lib/ralph/agents/compare.ts` — stock-vs-stock / MF-vs-MF agent
- `RALPH_TASK.md` — checkbox-driven success criteria
- `.ralph/PROMPT.md`, `.ralph/guardrails.md`, `.ralph/progress.md`,
  `.ralph/activity.log`, `.ralph/errors.log` — autonomous-iteration loop state
- `PR_DESCRIPTION.md` — this file

### Modified
- `app/layout.tsx` — mount the FAB globally
- `app/chat/page.tsx` — render score rings, agent cards, suggestion chips
- `lib/ralph/types.ts` — add `mf`/`compare` intents and `score`/`verdict`/`warnings`
  fields on `AgentFinding`
- `lib/ralph/router.ts` — universe-validated tickers, MF detection,
  compare splitting (with prefix-strip fix)
- `lib/ralph/orchestrator.ts` — dispatch all five intents and return
  `AgentFinding[]` to the UI
- `lib/ralph/agents/portfolio.ts` — full rewrite (P&L, sectors, winners/losers,
  concentration warnings)

## How to test locally

```bash
npm install
npm run dev
```

Then try these prompts in `/chat`:

| Prompt                                            | Intent     |
| ------------------------------------------------- | ---------- |
| `Analyze RELIANCE`                                | stock      |
| `Should I buy TCS?`                               | stock      |
| `Is Parag Parikh Flexi Cap a good buy?`           | mf         |
| `Compare HDFC Flexi Cap vs Quant Active Fund`     | mf compare |
| `TCS vs INFY`                                     | stock cmp  |
| `How is my portfolio doing?`                      | portfolio  |
| `Hello`                                           | general    |

The "Ask AI" FAB should appear bottom-right on every page except `/chat`
itself and the Clerk sign-in/up routes.

## Verification

- `npx tsc --noEmit` is clean for every file in this PR. Pre-existing TS
  errors elsewhere in the repo (`lib/db.ts`, `lib/rebalancer.ts`,
  `scripts/seed.ts`, etc.) are out of scope.
- Router smoke test: 12 of 12 prompts route to the expected intent
  (covered in `.ralph/progress.md`).

## Out of scope

- Streaming responses (SSE)
- New DB models — reuses `ChatThread` + `ChatMessage`
- Replacing the existing per-stock 6-agent engine
- Fixing the pre-existing TypeScript drift unrelated to chat

## Screenshots to add before merge

- [ ] FAB on the home page (light + dark)
- [ ] Stock answer with all 6 agent scorecards
- [ ] MF answer
- [ ] Comparison answer with three cards (compare + per-side)
- [ ] Portfolio answer with concentration warnings

## Risk

Low. The new intents and agents are additive — the existing stock pipeline
under `lib/agents/*` is untouched. The orchestrator falls back to the General
LLM agent when no intent matches and degrades gracefully when broker / MFAPI
calls fail.
