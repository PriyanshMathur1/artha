# Growth agent

Trailing growth + 3-scenario forward projection. Weight: **10%**.

## v1 (price proxy)
1Y and 3Y price CAGR from history. Score peaks at 12-25% base CAGR (sweet spot — high enough to compound, not so high to be a momentum bubble).

## v2 (replace with real fundamentals)
Wire revenue / EPS CAGR from a paid datasource (Trendlyne, Tijori, or scrape Screener). Drop the price proxy entirely — price ≠ growth.

## Scenarios
Three numbers shown to the user:
- `bear` — base − 12pp
- `base` — observed 1Y CAGR
- `bull` — base + 12pp

The 12pp band is a placeholder; replace with annualised volatility once the Risk agent computes it.
