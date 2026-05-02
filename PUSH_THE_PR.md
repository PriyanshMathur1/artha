# Push this PR to GitHub

I've staged all the changes locally but I can't push from this sandbox — it
needs your auth. Run the block below in your terminal from the repo root
(`/Users/priyansh/Desktop/artha`).

## Option A — using the `gh` CLI (one command opens the PR for you)

```bash
cd /Users/priyansh/Desktop/artha

# 1. Create a clean branch
git checkout -b feat/ai-chat-multi-agent

# 2. Stage everything this work touched
git add \
  RALPH_TASK.md \
  PR_DESCRIPTION.md \
  PUSH_THE_PR.md \
  .ralph/ \
  components/AskAIFab.tsx \
  app/layout.tsx \
  app/chat/page.tsx \
  lib/ralph/types.ts \
  lib/ralph/router.ts \
  lib/ralph/orchestrator.ts \
  lib/ralph/agents/mf.ts \
  lib/ralph/agents/compare.ts \
  lib/ralph/agents/portfolio.ts

# 3. Commit
git commit -m "feat(chat): Ralph multi-agent chat + Ask AI floating button

- New MF and Compare agents in lib/ralph/agents/
- Beefed-up portfolio agent (P&L, sectors, winners/losers, concentration)
- Universe-validated router with MF + compare intent detection
- Orchestrator dispatches stock / mf / portfolio / compare / general
- Chat UI renders score rings, agent cards, why bullets, suggestion chips
- Floating Ask AI FAB on every page (hidden on /chat and auth)
- Ralph autonomous-iteration loop scaffolding under .ralph/"

# 4. Push the branch
git push -u origin feat/ai-chat-multi-agent

# 5. Open the PR with the prepared description
gh pr create \
  --title "feat(chat): Ralph multi-agent chat + Ask AI floating button" \
  --body-file PR_DESCRIPTION.md \
  --base main
```

## Option B — without `gh` CLI (open PR manually in the browser)

```bash
cd /Users/priyansh/Desktop/artha

git checkout -b feat/ai-chat-multi-agent
git add RALPH_TASK.md PR_DESCRIPTION.md PUSH_THE_PR.md .ralph/ \
        components/AskAIFab.tsx app/layout.tsx app/chat/page.tsx \
        lib/ralph/types.ts lib/ralph/router.ts lib/ralph/orchestrator.ts \
        lib/ralph/agents/mf.ts lib/ralph/agents/compare.ts \
        lib/ralph/agents/portfolio.ts

git commit -m "feat(chat): Ralph multi-agent chat + Ask AI floating button"
git push -u origin feat/ai-chat-multi-agent
```

Then open: <https://github.com/PriyanshMathur1/artha/pull/new/feat/ai-chat-multi-agent>

Paste the contents of `PR_DESCRIPTION.md` into the PR body.

## Sanity-check before pushing

```bash
# See exactly what changed
git status
git diff --stat

# Make sure my new files typecheck
npx tsc --noEmit 2>&1 | grep -E \
  "components/AskAIFab\.tsx|app/(layout|chat/page)\.tsx|lib/ralph/(agents/(mf|compare|portfolio)|router|orchestrator|types)\.ts" \
  || echo "✅ Ralph + FAB files clean"
```

Pre-existing TS errors elsewhere in the repo (`lib/db.ts`, `lib/rebalancer.ts`,
`scripts/seed.ts`, etc.) are unrelated to this PR — leave them out of scope.

## After the PR opens

Optional: drop screenshots into the PR body as Vercel preview comes up. The
checklist at the bottom of `PR_DESCRIPTION.md` lists the five views worth
capturing.
