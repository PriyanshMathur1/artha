# Guardrails ("Signs")

These are lessons that future iterations of this loop must read before doing work.
Each sign is a rule that, if ignored, has cost time on this codebase.

---

### Sign: Don't break the existing stock pipeline
- **Trigger**: Editing `lib/ralph/agents/stock.ts` or `lib/agents/*`
- **Instruction**: The 6 per-stock agents are wired into `/api/analyze/[ticker]` and the
  Deep Scan UI. Treat them as a stable contract. Do not change return shapes or
  rename exports. The Ralph stock agent only consumes them.

### Sign: Angel One can be unauthenticated
- **Trigger**: Calling `getQuote`, `getSummary`, `getHistory`, or `runRebalance`
- **Instruction**: All Angel One paths can throw if no broker token is set. Wrap in
  try/catch and degrade gracefully — never let portfolio chat 500 because the user
  hasn't connected a broker.

### Sign: MFAPI returns dates as DD-MM-YYYY
- **Trigger**: Parsing `NavEntry.date` in MF code paths
- **Instruction**: Use the existing helpers in `lib/mfapi.ts` (`getMFTrailingReturns`,
  `getMFDirection`, `getCurrentNav`) instead of re-parsing dates. They already
  handle both YYYY-MM-DD and DD-MM-YYYY.

### Sign: Don't ship token-greedy LLM calls in the hot path
- **Trigger**: Adding new `openAIChat` calls
- **Instruction**: Stock / MF / portfolio paths are deterministic and cheap. Only
  the General agent uses LLM. If you add a synthesizer, cap `maxTokens ≤ 700`
  and pass only summarised findings — never raw history arrays.

### Sign: Router false positives on uppercase tokens
- **Trigger**: Editing the regex `\b([A-Z]{2,12})\b` in `lib/ralph/router.ts`
- **Instruction**: "I", "AND", "TO", "MY", "FOR" all match. Validate candidates
  against `NSE_UNIVERSE` from `lib/universe.ts` before treating them as tickers.

### Sign: ChatTurn store has a stale-update quirk
- **Trigger**: Editing `lib/ralph/store.ts` `appendMessage`
- **Instruction**: The current code does a redundant findUnique inside the title
  update to bump `updatedAt`. Don't "clean it up" without checking that
  `@updatedAt` actually fires on a no-op update — Prisma 7 may skip it.
