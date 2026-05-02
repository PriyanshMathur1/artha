# Moat agent

Estimates structural durability — brand, pricing power, switching cost, scale. Weight: **25%**.

v1 is heuristic (sector + ROE consistency + brand allowlist). v2 should plug in:
- Switching cost score (% recurring revenue)
- Brand rank (Interbrand / Kantar BrandZ India)
- Patent / IP density (for pharma + tech)
- Promoter holding stability

## Buckets

- `wide` (≥8) — Nestle, HUL, Asian Paints kind of durability
- `narrow` (6-7.9) — TCS, Infosys, Bajaj Finance
- `thin` (4-5.9) — competitive sectors
- `none` (<4) — commodities, low-margin distribution

## Rationale

Sector-baseline + ROE persistence + margin ceiling captures most of the signal. Brand allowlist is hand-curated to nudge household names; replace with actual brand data when you ingest it.
