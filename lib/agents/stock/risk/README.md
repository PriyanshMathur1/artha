# Risk agent

Penalises volatility, drawdown, beta divergence, leverage. Weight: **10%**.

## Components
- Volatility (30%): annualised stdev of daily log returns
- Max drawdown (30%): worst peak-to-trough drop in window
- Beta (20%): distance from 1.0 — both very low and very high beta penalised
- Leverage (20%): D/E ratio

## Buckets
- ≥7: low risk
- 5–7: moderate
- 3–5: high
- <3: speculative

## Extension ideas
- Conditional value-at-risk (CVaR)
- Liquidity risk (avg daily volume vs market cap)
- Concentration risk (top-10 client revenue)
- Audit qualification flags
