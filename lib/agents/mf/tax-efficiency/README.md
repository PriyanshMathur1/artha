# MF Agent: tax-efficiency

**Weight:** 0.10 · **Confidence:** 0.40–0.65

## What it measures

India-specific tax impact on mutual fund returns. Many investors focus only on
pre-tax returns; this agent quantifies the tax drag that erodes real wealth.

## Key India Tax Rules (FY2024)

| Fund type | Holding | Tax rate |
|-----------|---------|---------|
| Equity MF (≥65% equity) | > 1 year | 10% LTCG on gains > ₹1L |
| Equity MF | < 1 year | 15% STCG |
| Debt MF (post-Mar 2023) | Any | Income-tax slab rate |
| ELSS | > 3 years | 10% LTCG + **80C deduction ≤₹1.5L** |

## Signals

| Signal | Source | Notes |
|--------|--------|-------|
| `isElss` | Scheme name / category | 80C deduction = net benefit ₹15–45K at 10–30% slab |
| `isDebtFund` | Category keyword match | Post-2023 amendment makes these tax-inefficient |
| `isIndexFund` | Scheme name keyword | Near-zero turnover → minimal STCG |
| `estimatedTurnoverProxy` | NAV reversal count | Rough proxy; v2 needs AMFI portfolio disclosures |
| `estimatedCapGainsDragPct` | proxy × ret1y × 15% | Annual STCG drag estimate |
| `isDirect` | Scheme name | Direct saves 0.5–1% TER (cost, not tax) |

## Score adjustments

| Condition | Adjustment |
|-----------|-----------|
| Index fund | +2 |
| ELSS | +1.5 |
| Direct plan | +0.5 |
| Debt fund (post-2023) | −2.5 |
| High turnover (>0.5) | −2 |
| Moderate turnover (0.3–0.5) | −1 |
| Low turnover (<0.1) | +0.5 |

## Upgrade path (v2)

- Parse AMFI monthly portfolio disclosures for actual turnover ratios.
- Model actual LTCG/STCG split based on fund strategy and holding period.
- Incorporate STP (systematic transfer plan) optimization advice.
- Model tax-loss harvesting opportunities.

## References

- Finance Act 2023 — section 50AA (debt fund tax amendment)
- SEBI Mutual Fund Regulations — ELSS scheme guidelines
- AMFI portfolio disclosure format
