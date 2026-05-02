# Artha

> Wealth with purpose. AI-powered wealth management for the Indian working professional.

Artha is a multi-asset wealth platform: **stocks, mutual funds, insurance, EPF/PPF/NPS, FDs**. Every asset gets scored by a **multi-agent deep-scan engine** that produces a verdict (`Strong Buy → Avoid`) along with the per-agent reasoning.

Built on the same free-tier-first stack as StockMind: Next.js 15 + Clerk + Neon Postgres + Prisma, deployed on Vercel.

---

## What's in v1

| Module | Status |
| --- | --- |
| Stock screener (NSE/BSE) | Yes |
| Stock 6-agent deep scan | Yes |
| MF screener + tracking | Yes |
| MF 6-agent deep scan | Yes |
| Portfolio dashboard | Yes |
| Net-worth allocation | Yes |
| Insurance tracking | Schema ready, UI in v2 |
| EPF / PPF / NPS / FD | Schema ready, UI in v2 |
| Goal-based planning | Schema ready, UI in v2 |
| Account Aggregator (AA) | Phase 4 |
| Broker auto-sync | Phase 3 |

---

## The Multi-Agent Engine

Each asset class has its own dedicated agent suite. Every agent lives in its own folder with its own scoring logic, signals, and rationale generator.

```
lib/agents/
├── shared/                  ← contract, composer, verdict mapping
├── stock/
│   ├── fundamental/         ← PE/PB/ROE/ROCE/debt/margins
│   ├── moat/                ← brand, pricing power, switching cost
│   ├── technical/           ← momentum, entry zone, stop loss
│   ├── growth/              ← revenue/earnings CAGR, bull/bear/base
│   ├── risk/                ← volatility, max drawdown, leverage
│   └── sentiment/           ← news tone, market bias
├── mf/
│   ├── manager-quality/     ← tenure, alpha vs benchmark, fund-house
│   ├── expense-drag/        ← TER vs category, hidden costs
│   ├── style-drift/         ← stated vs actual style, churn
│   ├── risk-adjusted/       ← Sharpe, Sortino, downside capture
│   ├── consistency/         ← rolling-return distribution, top-quartile %
│   └── tax-efficiency/      ← turnover, capital gains drag, ELSS lock-in
├── insurance/               ← v2: coverage adequacy, ULIP cost-of-insurance, etc.
└── retirement/              ← v2: real return after tax+inflation
```

Each agent implements the shared contract:

```ts
interface Agent<TInput, TSignals> {
  name: string;
  weight: number;
  run(input: TInput): Promise<AgentResult<TSignals>>;
}
```

Composer collects results, applies weights, computes composite (0–10), maps to verdict, and persists to `ScanRun + AgentScore` tables.

---

## Quick start (local)

```bash
git clone <your-fork> artha
cd artha
npm install
cp .env.local.example .env.local
# fill in DATABASE_URL (Neon free tier) + Clerk keys
npx prisma generate
npx prisma db push
npm run dev
```

Open <http://localhost:3000>. Sign in via Clerk → `/dashboard`.

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Add the env vars from `.env.local.example` in Vercel project settings. Add a Neon Postgres database (free tier) and paste its connection URL into `DATABASE_URL`.

---

## Project structure

```
app/
  (root)/                    ← landing, auth pages
  dashboard/                 ← net worth + allocation
  stocks/                    ← screener + [ticker] detail
  mutual-funds/              ← screener + [code] detail
  portfolio/                 ← all holdings, edit
  insurance/                 ← (v2) policy tracker
  retirement/                ← (v2) EPF/PPF/NPS/FD
  api/                       ← REST endpoints
components/
  ui/                        ← Button, Card, Table primitives
  layout/                    ← Nav, Sidebar, Shell
  stock/, mf/, portfolio/, scan/, dashboard/
lib/
  db.ts                      ← Prisma client
  cache.ts                   ← in-memory + DB cache helpers
  data/
    yahoo.ts                 ← live stock data
    mfapi.ts                 ← live MF NAV + history
    universe.ts              ← seeded NSE universe
  agents/                    ← see structure above
  utils/
    money.ts, format.ts, tax.ts, xirr.ts
prisma/
  schema.prisma              ← 16 models, ready for all 4 asset classes
scripts/
  seed.ts                    ← seed NSE universe + sample MF schemes
```

---

## Adding a new agent

1. Create `lib/agents/<asset-class>/<agent-name>/agent.ts` exporting an object that satisfies `Agent<...>`.
2. Create `lib/agents/<asset-class>/<agent-name>/signals.ts` for any pure helpers.
3. Register it in `lib/agents/<asset-class>/index.ts`.
4. The composer auto-includes it on next scan run.

That's the whole contract. Each agent owns its own folder, its own tests, its own rationale templates.

---

## Legal notice

Artha is for personal research and educational use. Under SEBI (Investment Advisers) Regulations 2013, providing paid investment advice requires SEBI RA registration. AI-generated scores are **not** financial advice — always do your own due diligence.

---

## License

MIT.
