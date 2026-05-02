# Fundamental agent

Classic value + quality screen. Weight in composite: **30%**.

| Signal | Weight | Scoring shape |
| --- | --- | --- |
| PE | 30% | Lower better; <15 → ~9, ~50 → ~2 |
| PB | 15% | Lower better; <1.5 → ~9, ~8 → ~2 |
| ROE | 25% | Higher better; ≥20% → 9 |
| Debt/Equity | 15% | Lower better; D/E < 0.5 → ~9 |
| Net margin | 15% | Higher better; ≥20% → ~9 |

## Why this design

- Sector-agnostic baseline. v2 will add sector-relative scoring (banks, IT, pharma, etc.).
- Confidence drops when signals are missing — Yahoo data is patchy for smallcaps.
- Single agent owns its rationale generator → keeps the verdict tooltip readable.

## Extension ideas

- ROCE alongside ROE (matters more for asset-heavy sectors).
- Promoter pledge from BSE bulk filings (red flag).
- Working-capital cycle days.
- 5-year moving average of margins (smooths cyclicals).
