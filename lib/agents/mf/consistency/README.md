# MF Agent: consistency

**Weight:** 0.15 · **Confidence:** 0.20–0.90 (scales with rolling window count)

## What it measures

Rewards funds that reliably beat their category quartile thresholds year after year,
and penalises feast-or-famine return patterns. A fund with a 55% top-quartile hit
rate over 5 years is superior to one with a single stellar year.

## Signals

| Signal | Description |
|--------|-------------|
| `topQuartileHitRatePct` | % of rolling 252-day windows where annualised return ≥ category top-quartile threshold |
| `positiveWindowsPct` | % of windows with positive return (fallback when threshold unavailable) |
| `annualReturnMean` | Mean of rolling annual returns (%) |
| `annualReturnStdDev` | Std dev of rolling annual returns (%) |
| `returnSkewness` | Fisher skewness of distribution (+ = right-tail, desirable) |
| `rollingWindows` | Number of 252-day windows computed |

## Scoring

| Top-quartile hit rate | Base score |
|----------------------|-----------|
| 0% | 1 |
| 25% | 3 |
| 50% | 6 |
| 75% | 8.5 |
| 100% | 10 |

**Skewness adjustment:** ±0.5 × skewness bonus/penalty (cap 0–10).

## Data requirements

- Minimum **2 × 252 trading days** (~2 full years) for rolling analysis.
- Confidence saturates around 750 windows (~5 years of daily data).

## Fallbacks

| Condition | Behaviour |
|-----------|-----------|
| No `categoryStats.topQuartileRet3y` | Uses positive-return windows instead |
| < 504 trading days | Score = 5, confidence = 0.15, flag `insufficient-history` |

## Upgrade path

- Use SEBI monthly return data for category quartile computation instead of manual override.
- Add Jensen's alpha as supplementary consistency signal.
- Rolling Sharpe quartile rank vs category peers.
