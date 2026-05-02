# MF Agent: style-drift

**Weight:** 0.10 · **Confidence:** 0.3–0.85 (scales with NAV history depth)

## What it measures

Detects when a fund drifts from its declared investment mandate. A "large-cap" fund
that behaves statistically like a mid-cap fund is engaging in style drift — often to
chase returns in bull markets, at the expense of the risk profile the investor signed
up for.

## v1 signals (NAV-volatility proxy)

| Signal | Source | Notes |
|--------|--------|-------|
| `declaredStyle` | `MFInput.meta.declaredStyle` | Manual override (large/mid/small/flexi/multi) |
| `inferredStyle` | Daily return stddev × √252 | Empirical Indian vol thresholds |
| `styleSimilarity` | Matrix lookup | 0-1; null if declared or inferred is unknown |
| `cvReturns` | σ / μ of daily returns | Coefficient of variation |
| `navDataPoints` | len(dailyReturns) | < 60 → low-confidence neutral score |

### Annualised volatility thresholds (empirical, Nifty-based)

| Bucket | Approx ann. vol |
|--------|----------------|
| Large-cap | < 17% |
| Mid-cap | 17–25% |
| Small-cap | > 25% |

These are rough guides; actual market regimes shift them. v2 should use rolling
120-day windows to adapt.

## Scoring

| Condition | Score | Confidence |
|-----------|-------|-----------|
| No history (<60d) | 5 | 0.15 |
| No declared style | 5 | 0.30 |
| Perfect match | 9–10 | 0.3–0.85 |
| Adjacent mismatch | 6 | 0.3–0.85 |
| Strong mismatch | 1–4 | 0.3–0.85 |
| Flexi/Multi fund | ~7 | 0.3–0.85 |

## Upgrade path (v2)

- Parse SEBI monthly portfolio disclosure PDFs (factsheets) to get actual large/mid/small
  allocation percentages.
- Replace volatility heuristic with direct portfolio composition analysis.
- Add category-relative drift (fund vs peers in same SEBI category).

## References

- SEBI categorisation circular (Oct 2017) — defines Nifty 100 / 150 / 250 bucket rules
- Morningstar Style Box methodology
