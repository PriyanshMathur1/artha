# Artha Terminal — Architecture

A plain-English tour of how the app is wired. Audience: a smart non-engineer
who wants to understand what's happening, or a new engineer on day one.

If you're looking for *how to add a feature*, read **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** instead.

---

## What Artha is, in one paragraph

Artha is a Bloomberg-style terminal for Indian retail investors. You search
any NSE stock or mutual fund, get a verdict from a panel of AI agents, sync
your real holdings from Angel One or Zerodha, and chat with **Ralph** — a
multi-agent assistant — to ask questions like *"Analyze TCS"*, *"How is my
portfolio doing?"*, or *"PPFAS Flexi Cap vs Quant Active Fund"*.

---

## Big-picture system map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                               THE BROWSER                                │
│  ┌──────────────┐  ┌───────────┐  ┌────────────┐  ┌─────────────────┐    │
│  │  Screener    │  │ Deep Scan │  │ Portfolio  │  │  Ralph Chat     │    │
│  │  /           │  │ /stock/X  │  │ /portfolio │  │  /chat + FAB    │    │
│  └──────┬───────┘  └─────┬─────┘  └─────┬──────┘  └────────┬────────┘    │
└─────────┼────────────────┼──────────────┼──────────────────┼─────────────┘
          │ HTTP           │              │                  │
          ▼                ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS API ROUTES (app/api/*)                │
│                                                                          │
│  /search   /screener   /quote/[t]   /fundamentals/[t]   /history/[t]     │
│  /analyze/[t]   /portfolio/overview   /portfolio/stocks   /portfolio/mf  │
│  /rebalance   /alerts   /watchlist   /chat   /chat/threads               │
└────┬───────────┬─────────────────────────────┬──────────────┬────────────┘
     │           │                             │              │
     ▼           ▼                             ▼              ▼
┌──────────┐  ┌──────────────────────┐  ┌────────────┐  ┌──────────────┐
│  Clerk   │  │    Market data       │  │  Postgres  │  │ Ralph chat   │
│  (auth)  │  │  Yahoo · Angel One · │  │ (Neon, via │  │ (multi-agent │
│          │  │  MFAPI               │  │  Prisma 7) │  │  orchestr.)  │
└──────────┘  └──────────────────────┘  └────────────┘  └──────────────┘
```

---

## What happens on each user action

### 1. "Show me Reliance" → Deep Scan

```
   user clicks "Deep Scan" on /stock/RELIANCE
        │
        ▼
   GET /api/analyze/RELIANCE
        │
        ▼
   ┌─────────────────────────────────────────────────┐
   │  fetch quote + fundamentals + 1Y history        │
   │   from Angel One (live), fallback Yahoo         │
   └────────────────┬────────────────────────────────┘
                    │
                    ▼
   ┌────────────────────────────────────────────────────┐
   │   six agents run in parallel:                      │
   │     fundamental (30%) + moat (25%) + technical (20%)│
   │     + growth (10%) + risk (10%) + sentiment (5%)   │
   └────────────────┬───────────────────────────────────┘
                    │
                    ▼
   composite = weighted average → verdict
   (Strong Buy / Buy / Hold / Caution / Avoid)
                    │
                    ▼
   browser renders six scorecards + the headline verdict
```

### 2. "Ask Ralph" → multi-agent chat

```
   user types "PPFAS Flexi Cap vs Quant Active Fund"
        │
        ▼
   POST /api/chat
        │
        ▼
   ralphRespond({ turns, userId })
        │
        ▼
   ┌──────────────┐
   │   Router     │  ← classifies intent: stock / mf / portfolio / compare / general
   └──────┬───────┘
          │ "compare" + kind: 'mf'
          ▼
   ┌────────────────────────────────────────────────┐
   │  Compare specialist                            │
   │   ├─ MF agent for "PPFAS Flexi Cap"  ─┐        │
   │   └─ MF agent for "Quant Active Fund" ┘        │
   │   (both run in parallel via Promise.all)       │
   └──────┬─────────────────────────────────────────┘
          │
          ▼
   { answer, why[], nextSteps[], agents[3] }   ← three cards: compare + 2 sides
          │
          ▼
   chat UI renders bubble + score-ring cards + suggestion chips
```

### 3. "How is my portfolio?" → Portfolio agent

```
   user asks → router picks "portfolio" → portfolio agent
        │
        ▼
   ┌─────────────────────────────────────────────────┐
   │ Pull holdings from Postgres                     │
   │  (StockHolding, MFHolding, Watchlist)           │
   └────────────────┬────────────────────────────────┘
                    │
                    ▼
   ┌────────────────────────────────────────────────┐
   │ Best-effort live prices                        │
   │  ├─ Angel One getQuote() per stock             │
   │  └─ MFAPI getCurrentNav() per scheme           │
   │  (failures fall back to cost basis silently)   │
   └────────────────┬───────────────────────────────┘
                    │
                    ▼
   compute totals, sectors, winners, losers, warnings
                    │
                    ▼
   one rich AgentFinding card → answer + why + nextSteps
```

---

## Where data comes from (and how it fails)

| Source | What it powers | Failure mode | Fallback |
|---|---|---|---|
| **Yahoo Finance** (unofficial) | Quotes, fundamentals, history | Rate limit, format change | Cached + 60s in-memory cache |
| **Angel One SmartAPI** | Live NSE quotes, holdings sync | Token expiry (24h) | Yahoo Finance |
| **Zerodha Kite Connect** | Holdings sync via CSV import | API changes | Manual CSV upload |
| **MFAPI.in** | NAV history, trailing returns | Outage | Trailing returns null, agent says "insufficient data" |
| **Neon Postgres** | User holdings, alerts, watchlist, chat threads | Connection limit | Serverless adapter |
| **OpenAI (optional)** | General-chat fallback only | Missing API key | Polite stub |

The product runs on **₹0/month at zero scale**: every paid service (Vercel,
Neon, Clerk) has a free tier large enough for a single-developer hobby
project.

---

## Folder map

```
artha/
├── app/                  ← Next.js App Router pages + API routes
│   ├── page.tsx          ← Home (screener)
│   ├── stock/[ticker]/   ← Deep-dive page
│   ├── portfolio/        ← Holdings + MF tracking
│   ├── chat/             ← Ralph multi-agent chat UI
│   ├── rebalance/        ← Rebalancer page
│   ├── watchlist/        ← Watchlist
│   ├── alerts/           ← Alerts
│   └── api/              ← Server-side endpoints (23 routes)
│
├── components/           ← React UI
│   ├── DeepDive/         ← Stock-page widgets (scorecards, charts, news)
│   ├── Portfolio/        ← Holdings tables, import flows, rebalance report
│   ├── AskAIFab.tsx      ← Floating "Ask AI" button (chat entry point)
│   └── *.tsx             ← Shared UI (search bar, navbar buttons, etc.)
│
├── lib/
│   ├── agents/           ← The 6-agent stock engine (fundamental, technical,
│   │                       moat, growth, risk, sentiment)
│   ├── ralph/            ← Multi-agent CHAT engine (router, orchestrator,
│   │                       agents/, types, store)
│   │   ├── orchestrator.ts  ← Single entry point: `ralphRespond()`
│   │   ├── router.ts        ← Picks the intent
│   │   ├── agents/          ← stock | mf | portfolio | compare | general
│   │   └── types.ts         ← Public contracts (RalphResponse, AgentFinding)
│   ├── llm/              ← OpenAI wrapper (used only by general agent)
│   ├── yahoo.ts          ← Yahoo Finance client + 60s cache
│   ├── angelone.ts       ← Angel One SmartAPI client
│   ├── zerodha.ts        ← Zerodha Kite client
│   ├── mfapi.ts          ← MFAPI.in client
│   ├── universe.ts       ← NSE stock universe (500+) — source of truth
│   ├── rebalancer.ts     ← Portfolio rebalancing logic
│   ├── alerts.ts         ← Alert creation helpers
│   ├── email.ts          ← Nodemailer + digest HTML
│   └── db.ts             ← Prisma 7 + Neon adapter — single client export
│
├── prisma/
│   └── schema.prisma     ← 9 models (holdings, MFs, alerts, chat threads, …)
│
├── .ralph/               ← Autonomous-iteration loop state (see Ralph below)
└── RALPH_TASK.md         ← Checkbox-driven task definition for Ralph mode
```

---

## How Ralph (the chat) is built

Ralph is the multi-agent assistant at `/chat`. It's deliberately structured
so adding a new intent is a 4-step recipe (router case + agent file +
orchestrator case + UI nothing).

```
                user prompt
                     │
                     ▼
              ┌─────────────┐
              │   router    │  ← lib/ralph/router.ts
              └──────┬──────┘
                     │
        ┌────────────┼────────────┬────────────┬────────────┐
        ▼            ▼            ▼            ▼            ▼
     stock         mf         portfolio     compare      general
   (lib/ralph/  (lib/ralph/   (lib/ralph/  (lib/ralph/  (lib/ralph/
    agents/      agents/       agents/      agents/      agents/
    stock.ts)    mf.ts)        portfolio    compare      general.ts
                                .ts)         .ts)        — LLM only)
        │            │            │            │            │
        └────────────┴─────┬──────┴────────────┴────────────┘
                           ▼
                  ┌──────────────────┐
                  │   orchestrator   │  ← lib/ralph/orchestrator.ts
                  │   ralphRespond() │
                  └────────┬─────────┘
                           ▼
              { answer, why[], nextSteps[], agents[] }
                           ▼
                ┌────────────────────────┐
                │  app/chat/page.tsx     │
                │  bubble + score-ring   │
                │  cards + chips         │
                └────────────────────────┘
```

**Key contract:** every specialist returns `AgentFinding` objects — same
shape — so the chat UI is one renderer that handles all five intents.

---

## What's deliberately *not* in this codebase

- **No streaming responses.** The chat is request/response. Adding SSE is on
  the backlog but introduces ordering complexity around the score cards.
- **No real-time WebSocket prices.** Quotes are pulled per request and
  cached for 60 seconds. The Zerodha ticker WS is wired but unused for now.
- **No paid market data feed.** Yahoo + Angel One + MFAPI cover everything
  the agents need; a real Bloomberg replacement would need (e.g.) NSE TBT.
- **No portfolio optimizer / Modern Portfolio Theory.** The rebalancer is
  rule-based: trim concentration, add to under-weighted sectors, flag
  losers. No mean-variance, no Black-Litterman.

---

## Ralph autonomous-iteration loop

The `.ralph/` directory plus `RALPH_TASK.md` together describe the
*technique* used to build the chat itself: iterate on a fixed prompt with
state in files (not memory). If you want to extend the chat further (add a
new intent, a new agent, a new sub-skill), follow the loop:

1. Add a checkbox to `RALPH_TASK.md`.
2. Read `.ralph/PROMPT.md`, `.ralph/guardrails.md`, `.ralph/progress.md`.
3. Make the change. Update `.ralph/progress.md`.
4. Run `npx tsc --noEmit`. Tick the box.

The loop is described in detail at <https://ghuntley.com/ralph/>.
