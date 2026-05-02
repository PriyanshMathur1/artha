# Expense-drag agent

Penalises high TER, rewards direct plans. Weight: **20%**.

## Why this matters

Vanguard's longest-running study (Bogle, 2007) found that the cheapest quartile of US equity funds outperformed the most expensive quartile by ~140 bps annually. SPIVA India shows similar dispersion. A 1% TER difference compounds to ~10% smaller corpus over 10 years.

This agent exists to make the cost trade-off impossible to ignore in the verdict.

## Inputs
- Expense ratio (manual / scraped)
- Category median TER (for relative scoring)
- Direct vs regular plan (parsed from scheme name)

## v2 ideas
- Wrap exit-load drag into the score (some schemes have 1% exit load if redeemed <1y)
- Brokerage-driven TER (some sub-broker plans add commission)
