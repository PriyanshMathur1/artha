# Push the cleanup + docs commit

The cleanup + documentation work is staged on top of the existing
`feat/ai-chat-multi-agent` branch. One push wraps everything into the same
PR — chat + FAB + cleanup + docs land together.

## One command

```bash
cd /Users/priyansh/Desktop/artha && \
git rm -f lib/utils/cn.ts lib/utils/format.ts scripts/seed.ts 2>/dev/null; \
git add -A && \
git commit -m "chore: cleanup + ARCHITECTURE.md + DEVELOPER_GUIDE.md + JSDoc on lib/ralph/*

- Add ARCHITECTURE.md (plain-English diagrams + data flow + folder map)
- Add DEVELOPER_GUIDE.md (engineer onboarding + tech-debt map)
- README points to both docs
- JSDoc every public export under lib/ralph/* (types, router, orchestrator, agents)
- Remove dead files: lib/utils/cn.ts, lib/utils/format.ts, scripts/seed.ts
- Drop scripts exclusion from tsconfig (file is gone)" && \
git push
```

That's it. Vercel will rebuild automatically.

## What this push contains

| File | What changed |
|---|---|
| `ARCHITECTURE.md` | **New.** Plain-English architecture tour with ASCII diagrams. |
| `DEVELOPER_GUIDE.md` | **New.** Engineer onboarding + decision trees + tech-debt map. |
| `README.md` | New "New here?" section linking the two docs. |
| `lib/ralph/types.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/router.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/orchestrator.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/agents/stock.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/agents/mf.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/agents/portfolio.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/agents/compare.ts` | Module + per-export JSDoc. No code change. |
| `lib/ralph/agents/general.ts` | Module + per-export JSDoc. No code change. |
| `.ralph/progress.md` | Iteration 2 log. |
| `lib/utils/cn.ts` | **Deleted** (orphan; nothing imported it). |
| `lib/utils/format.ts` | **Deleted** (orphan; nothing imported it). |
| `scripts/seed.ts` | **Deleted** (broken stale-import dev script). |
| `tsconfig.json` | Removed the `scripts/` exclude (file is gone). |

## Build risk

Low. Verified:
- `npx tsc --noEmit` is clean for every Ralph + chat UI + FAB file.
- The deleted files were universe-validated as orphans (no `import` from
  any source file in the repo).
- The remaining pre-existing implicit-any "errors" in the sandbox typecheck
  only appear because `prisma generate` doesn't run locally; on Vercel they
  evaporate after the `postinstall` + `build` regenerates the client.

If something does fail on Vercel, paste the log and I'll patch.
