# Sentiment agent

Captures market mood. Weight: **5%** (intentionally small — sentiment is noisy).

## v1 (momentum proxy)
- 1-month return
- 6-month return
- Simple classifier: both positive → positive, both negative → negative

## v2 ideas
- Yahoo `recommendationTrend` (analyst buy/hold/sell counts)
- News tone via RSS + small classifier
- Bulk-deal & block-deal disclosures (BSE/NSE)
- Twitter/Reddit mention deltas (with rate-limit safeguards)
- Promoter pledge changes

The intentionally low weight means sentiment can flip without dragging the verdict.
