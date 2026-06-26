# Pipeline: Insights & Hotspots (Phases 8–9)

Predictive analytics layer: pre-aggregated daily metrics, geohash hotspot scoring, trend narratives, and batch insights for municipal dashboards.

## Triggers

| Endpoint | Purpose |
|----------|---------|
| `GET /api/analytics/summary` | Dashboard KPIs + Gemini insight card |
| `GET /api/analytics/trends` | 7/30-day trends, category momentum, narrative |
| `GET /api/analytics/hotspots` | Top geohash-6 clusters for open issues |
| `POST /api/analytics/insights-batch` | Admin batch job (Agent 6) |

Implementation: `server/src/routes/analytics.ts`, `server/src/lib/analytics-cache.ts`, `server/src/lib/agents/insights.ts`.

## Caching layers

1. **L3 in-memory** (`getL3Summary` / `setL3Summary`) — 15-minute TTL for hot summary reads.
2. **Firestore `analytics_daily/{date}_{wardId}`** — pre-aggregated open/resolved counts, category breakdown, SLA tables. Read via `readAnalyticsDaily()` when fresh; written by summary route and insights batch.
3. **`insights/latest`** — narrative, `categoryTrends`, recurring issues from batch agent.

## Hotspot scoring (Model D)

Open issues (`Submitted` → `In Progress`) are bucketed by geohash-6:

```
score = count * 2 + recent * 3 + severity
predictive = recent >= 3 && count >= 5
```

Results are returned from `GET /api/analytics/hotspots` and persisted to `hotspots/{geohash}` for map overlays.

## Trend payload

`GET /api/analytics/trends` returns:

- `daily7` / `daily` — open vs resolved per day (7d)
- `daily30` — report volume per day (30d)
- `categoryTrends` — `{ last7, last30, prev7 }` per category
- `recurringIssues` — same category + geohash-6 with ≥2 reports in 30d
- `seasonalWasteSpike` — waste category week-over-week alert
- `preventiveZones` — predictive hotspot subset
- `narrative` — Gemini lite summary (fallback rules if AI unavailable)

## Agent 6 — Insights Analyst

`runInsightsBatch()` (`server/src/lib/agents/insights.ts`):

1. Fetches issues + upvote events
2. Computes summary, category trends, SLA breach count
3. Writes `analytics_daily`, updates `hotspots` collection
4. Generates narrative and stores `insights/latest` + `analytics/insights_latest`

Protected endpoints: `POST /api/analytics/internal/insights` and `POST /api/analytics/insights-batch` require `ADMIN_SECRET` / `ADMIN_API_SECRET` header.

## Frontend surfaces

| Surface | Data |
|---------|------|
| `/dashboard` | KPIs, 30d chart, category momentum, hotspot map overlay |
| `/map` | Toggleable hotspot markers on `CivicMap` |
| `/admin/analytics` | Ward heatmap, category trends, recurring issues |

## Related

- [api_contract.md](../api_contract.md) — HTTP schemas
- [13-analytics-pipeline.mmd](../diagrams/mermaid/13-analytics-pipeline.mmd) — diagram
- [system-design.md](../system-design.md) — L4 `analytics_daily` design
