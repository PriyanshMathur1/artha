# Technical agent

Trend + momentum + position-in-range. Weight: **20%**.

## Inputs
1y daily candles. Falls back to neutral if <50 sessions of data.

## Sub-scores
- Trend (40%): 50DMA vs 200DMA → golden-cross check
- RSI-14 (30%): 30-60 ideal, >70 overbought, <30 oversold (which we read as opportunity)
- Position in 52-wk range (30%): 30-60% sweet spot

## Outputs
- `signal`: bullish / neutral / bearish
- `entryZone`: ±5% of 200DMA
- `stopLoss`: 8% below 200DMA

These are educational suggestions, not orders. The verdict UI labels them as such.

## Extension ideas
- MACD histogram divergence
- Volume-weighted average price (VWAP)
- ADX for trend strength
- Multi-timeframe alignment (daily + weekly)
