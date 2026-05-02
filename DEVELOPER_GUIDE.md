# Developer Guide

For day-one engineers and future-you. The big picture lives in
**[ARCHITECTURE.md](./ARCHITECTURE.md)**; this file is about *doing things*.

---

## Local setup (3 commands)

```bash
git clone https://github.com/PriyanshMathur1/artha.git
cd artha && npm install
cp .env.local.example .env.local   # then fill in keys, see below
npm run dev                        # http://localhost:3000
```

`npm install` runs `prisma generate` automatically (postinstall hook). If you
ever see "Property 'X' does not exist on type 'PrismaClient'" — your generated
client is stale. Run `npx prisma generate` and try again.

### Required env vars

| Var | Why | Where to get it |
|---|---|---|
| `DATABASE_URL` | Postgres on Neon | <https://console.neon.tech> |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth | <https://dashboard.clerk.com> |
| `CLERK_SECRET_KEY` | Auth | same |
| `OPENAI_API_KEY` *(optional)* | Ralph general-chat fallback | <https://platform.openai.com> |
| `ANGEL_ONE_API_BASE` *(optional)* | Live broker quotes | Angel One SmartAPI |
| `EMAIL_FROM` / SMTP creds *(optional)* | Daily digest emails | Gmail SMTP works |

The app runs without the optional keys — features that need them degrade
gracefully (Ralph falls back to deterministic answers, broker sync becomes a
no-op, etc.).

---

## Where to add a new feature (decision tree)

```
Are you adding…
│
├── A new screener filter or stock-page widget?
│       → components/DeepDive/* or components/Portfolio/*
│       → if it needs new data, add an API route under app/api/
│
├── A new market-data source (e.g. NSE TBT, alternative provider)?
│       → new file lib/<vendor>.ts
│       → expose the same getQuote/getSummary/getHistory shape as lib/yahoo.ts
│       → wire it as a fallback inside lib/angelone.ts or wherever the
│         consumer lives
│
├── A new chat intent for Ralph (e.g. "compare sector ETFs")?
│       → see "Adding a Ralph intent" below — it's a 4-file change
│
├── A new database model?
│       → edit prisma/schema.prisma
│       → run `npx prisma migrate dev --name <name>`
│       → the postinstall hook regenerates the client on next install
│
├── A new background job?
│       → add an API route under app/api/cron/<name>
│       → wire it in vercel.json (cron schedule) — does not exist yet
│
└── Just a bug fix?
        → keep the diff small. The codebase has a lot of moving parts;
          surgical edits ship faster than refactors.
```

### Adding a Ralph intent (4-file recipe)

1. **`lib/ralph/types.ts`** — add the new intent to `RalphIntent`.
2. **`lib/ralph/router.ts`** — add a detection branch and `RouteResult` field.
3. **`lib/ralph/agents/<intent>.ts`** — write the specialist; export a
   function returning `{ finding: AgentFinding, …extras }`.
4. **`lib/ralph/orchestrator.ts`** — add a `if (route.intent === '<intent>')`
   block that calls the specialist and shapes `RalphResponse`.

The chat UI doesn't need any change — it renders `AgentFinding[]` regardless.
Run `npx tsc --noEmit` after each step.

---

## Conventions

### Naming
- **Files**: kebab-case for libraries (`lib/mfapi.ts`), PascalCase for React
  components (`components/AskAIFab.tsx`).
- **Types/interfaces**: PascalCase, singular (`StockHolding`, `AgentFinding`).
- **Functions**: camelCase verb phrases (`runMFAgent`, `routeRalph`,
  `getCurrentNav`).
- **Tests** (when we have any): `*.test.ts` next to the file under test.

### Error handling
- **API routes**: catch every external call. Return `{ error: string }` with
  a 4xx/5xx status. Never let an unhandled promise crash the route.
- **Agents**: degrade gracefully. A missing token / dead upstream should
  produce a useful answer, not throw. Wrap risky calls in `Promise.allSettled`
  and unwrap manually.
- **UI**: render-time errors should not blank the page. Use `ErrorBoundary`
  (`components/ErrorBoundary.tsx`) at the page level.

### When to use the LLM
- **Don't** for anything deterministic (computing scores, picking tickers,
  parsing tables, formatting numbers).
- **Do** for free-form natural-language synthesis (Ralph General agent only).
- **Cap tokens.** Every `openAIChat` call must pass `maxTokens` ≤ 700.
- **Prompt cost is per-request real money.** The general-chat path is the
  only LLM call in the hot path; keep it that way.

### State and persistence
- **Browser state**: React `useState` / `localStorage` for ephemeral UI
  (chat scroll position, FAB seen-marker).
- **User data**: Postgres via Prisma. Always scope by `userId` from Clerk.
- **Server-side cache**: in-memory `Map` with TTL (see `lib/angelone.ts`).
  No Redis yet; add one if cache pressure becomes real.

---

## Pre-existing tech debt (severity-tagged)

This is what I haven't fixed yet, ranked. Anything tagged 🟢 is safe to
touch; anything 🔴 has hidden contracts and deserves more care.

| Severity | Where | What |
|---|---|---|
| 🟢 | `lib/utils/cn.ts` + `lib/utils/format.ts` | Orphan utility files; nothing imports them. Stubbed to remove broken deps. Safe to delete. |
| 🟢 | `scripts/seed.ts` | Dev seed script with stale import path. Excluded from tsconfig. Either fix the import or `git rm`. |
| 🟡 | `app/api/portfolio/overview/route.ts` | Mixed price-source logic (Angel One + Yahoo) duplicates `lib/rebalancer.ts`. Worth consolidating into `lib/market-data/`. |
| 🟡 | `lib/yahoo.ts` + `lib/angelone.ts` | Two separate clients with overlapping responsibilities. Could be unified behind a single `MarketDataClient` interface. |
| 🟠 | `lib/rebalancer.ts` | 400+ lines, mixes data fetching, scoring, and report generation. Splitting into 3 files would help review-ability. |
| 🟠 | `lib/ralph/store.ts:40` | `appendMessage` does a redundant findUnique to bump `updatedAt`. Prisma 7 *should* fire `@updatedAt` on no-op updates but verify before "cleaning up". |
| 🔴 | `lib/agents/*` (the 6 stock agents) | The 100-point sub-scoring rubric is calibrated against live NSE data. Rewriting risks bias drift. Don't touch unless you have a regression suite. |
| 🔴 | `prisma/schema.prisma` migrations | `MFNavCache.navDate` is a `String` not `DateTime` because MFAPI returns DD-MM-YYYY. Changing this is a destructive migration. |

---

## Common tasks

### "I changed `prisma/schema.prisma` — what now?"
```bash
npx prisma migrate dev --name <descriptive-snake-case>
```
The generated client is rebuilt automatically. Commit both the migration SQL
and the schema change.

### "I want to add a new env var"
1. Add it to `.env.local.example` with a placeholder value.
2. Document it in this file's *Required env vars* table.
3. Add it to Vercel: **Project → Settings → Environment Variables**.
4. Reference it via `process.env.NAME` and validate at module load.

### "Vercel build is failing"
Check the error class:
- *"Type error: ... does not exist on type 'PrismaClient'"* → schema changed,
  prisma client out of date. The `prisma generate` in `build` should handle
  this; if it doesn't, the build cache is stale → click **Redeploy without
  cache** in the Vercel dashboard.
- *"Module not found"* → missing dep. Either install it (`npm i <name>`)
  or rewrite the importing file without it (we did this for
  `tailwind-merge` and `date-fns`).
- *"Cannot find module"* in `scripts/` → ignore; `tsconfig.json` excludes
  `scripts/` from the production typecheck.
- ESLint errors → we set `eslint.ignoreDuringBuilds: true` in
  `next.config.js`. If a lint error blocks you locally, run `npm run lint`
  to see the full list and patch.

### "I want to test the chat without an LLM key"
Stock / MF / portfolio / compare intents are 100% deterministic. Only the
general-chat fallback uses the LLM. Test prompts:
- `Analyze RELIANCE` (stock)
- `Parag Parikh Flexi Cap` (mf)
- `How is my portfolio?` (portfolio — needs you signed in)
- `TCS vs INFY` (compare)

### "I want to run an autonomous iteration loop on this codebase"
That's Ralph mode — see `.ralph/PROMPT.md` and `RALPH_TASK.md` at the repo
root. The pattern is documented at <https://ghuntley.com/ralph/>.

---

## Code review checklist

Before merging a PR:

- [ ] `npx tsc --noEmit` passes for every file the PR touches
- [ ] No new `any` types without an explanation comment
- [ ] No new dependencies without a justification in the PR description
- [ ] Every external call is wrapped in try/catch
- [ ] LLM calls (if any) cap `maxTokens` and don't pass raw user content
- [ ] Database queries are scoped by `userId`
- [ ] User-facing strings are kind, plain English (this is a retail product)
- [ ] If the chat is touched, the smoke prompts in `.ralph/progress.md` still
      route correctly
- [ ] Public functions have a one-paragraph JSDoc

---

## Glossary

| Term | Meaning |
|---|---|
| **Agent** | A single specialist that takes input and returns an `AgentFinding`. The codebase has two agent families: the 6 stock-analysis agents under `lib/agents/`, and the 5 chat agents under `lib/ralph/agents/`. |
| **Composite score** | The 0–10 weighted average of the 6 stock agents' scores. Drives the verdict label. |
| **Deep Scan** | The button on `/stock/<ticker>` that triggers `/api/analyze/<ticker>` and renders all 6 scorecards. |
| **Ralph** | Codename for the multi-agent chat at `/chat`. Also the name of the autonomous-iteration technique used to build it. |
| **Scrip token** | Angel One's internal numeric ID for a security. We resolve symbol → token via `lib/scrip-tokens.json` (cached) or the ScripMaster API. |
| **NAV** | Net Asset Value — the per-unit price of a mutual fund. Updated daily by AMCs. |
| **AMC** | Asset Management Company — the fund house (Parag Parikh, Quant, Mirae, etc.). |
| **AMFI** | Association of Mutual Funds in India. They publish the canonical scheme codes that MFAPI mirrors. |
