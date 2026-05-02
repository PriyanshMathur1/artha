# MF Agent: risk-adjusted

**Weight:** 0.20 · **Confidence:** 0.40–0.95 (scales with NAV data depth)

## What it measures

How efficiently the fund converts volatility and drawdowns into investor returns.
Raw return alone is misleading — a fund that earns 18% by taking 35% drawdown risk
is far inferior to one earning 14% with a 12% drawdown.

## Signals

| Signal | Formula | Source |
|--------|---------|--------|
| `sharpe` | (ret − 6.5%) / annualisedVol | signals.ts |
| `sortino` | (ret − 6.5%) / downsideVol | signals.ts |
| `calmar` | annualisedRet / maxDrawdown | signals.ts |
| `maxDrawdownPct` | Peak-to-trough decline % | signals.ts |
| `annualisedVolPct` | σ × √252 × 100 | signals.ts |
| `annualisedReturnPct` | μ × 252 × 100 | signals.ts |

Risk-free rate: **6.5% p.a.** (approximate 10-year Indian G-Sec yield). Update in
`signals.ts` when rate regime changes significantly.

## Score blending

| Metric | Weight in composite |
|--------|-------------------|
| Sortino | 40% |
| Sharpe | 25% |
| Calmar | 20% |
| Max drawdown | 15% |

Sortino is primary because it only penalises downside volatility — consistent with
how Indian retail investors experience loss aversion.

## Score benchmarks

| Sortino | Score |
|---------|-------|
| < 0 | 1–3 |
| 0–1 | 3–6 |
| 1–2 | 6–9 |
| > 2 | 9–10 |

## Data requirements

- Minimum **120 trading days** (~6 months) for a meaningful score.
- Confidence saturates at ~1,000 days (~4 years).

## Upgrade path

- Add rolling Sharpe (12-month window) to detect recent deterioration.
- Downside-capture vs Nifty 50 when live benchmark data is available.
- Tail-risk: CVaR(95%) from return distribution.
