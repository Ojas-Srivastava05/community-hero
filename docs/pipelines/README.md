# Civic Pipelines Index

Nine modular pipelines (Section 23) power Community Hero. Each pipeline returns a normalized envelope:

```json
{ "status", "issue_id", "data", "confidence", "data_source", "latency_ms" }
```

**Architecture principle (Section 20.1):** Each subsystem is self-contained; register in `pipeline_registry.ts` without touching the core orchestrator.

---

## Pipeline catalog

| # | Pipeline | Trigger | Phase | Doc | Implementation |
|---|----------|---------|-------|-----|----------------|
| 1 | **Intake** | `POST /api/reports` multipart | 2 | [intake.md](intake.md) *(Phase 2)* | `server/src/routes/reports.ts` |
| 2 | **Vision** | After intake upload | 2 | [vision.md](vision.md) *(Phase 2)* | `server/src/lib/gemini.ts` |
| 3 | **Geo** | Parallel on submit | 3 | [geo.md](geo.md) *(Phase 3)* | `server/src/lib/geo.ts` |
| 4 | **Dedup** | Post-vision | 5 | *(notes in vision.md)* | `server/src/lib/agents.ts` |
| 5 | **Verification** | `POST /api/reports/:id/upvote` | 5 | [verification.md](verification.md) *(Phase 5)* | `server/src/routes/reports.ts` |
| 6 | **Routing** | Post-dedup | 6 | — | `server/src/lib/agents.ts` |
| 7 | **Resolution** | `POST /api/reports/:id/status` | 7 | — | `server/src/routes/reports.ts` |
| 8 | **Insights** | `GET /api/analytics/*` | 8–9 | [insights.md](insights.md) *(Phase 9)* | `server/src/routes/analytics.ts` |
| 9 | **Notification** | Status change events | 6 | — | `server/src/lib/agents.ts` |

> Per-pipeline docs: [intake](intake.md), [vision](vision.md), [geo](geo.md), [verification](verification.md), [insights](insights.md). Routing, resolution, and notification are documented in [architecture.md](../architecture.md) § agent pipeline (Phase 15).

---

## Orchestration flow

```
Intake → Vision → Geo (parallel with upload)
              ↓
         Dedup → [merge?] → Routing → Firestore write
              ↓
         Notification + Gamification
              ↓
    Resolution (admin) → Insights (aggregates)
```

See [`docs/diagrams/mermaid/04-agent-workflow.mmd`](../diagrams/mermaid/04-agent-workflow.mmd) and [`05-report-intake-sequence.mmd`](../diagrams/mermaid/05-report-intake-sequence.mmd).

---

## Latency budget (Section 4.3)

| Step | Target |
|------|--------|
| Client GPS | < 200 ms |
| Image compress (client WebP 1280px) | < 500 ms |
| Upload to Storage | < 800 ms |
| Gemini classify (Flash) | < 1,500 ms |
| Firestore write + realtime | < 300 ms |
| **Total perceived** | **~2.5–3.5 s** |

---

## Data integrity (Section 20.3)

- Tag AI fields with `data_source: "ai"` in `aiMetadata`.
- Confidence `< 0.6` → `needs_review` / `Draft` status — do not auto-publish to map.
- Demo seed issues must set `isDemo: true`.

---

## Related

- [architecture.md](../architecture.md) — agent pipeline overview
- [system-design.md](../system-design.md) — design principles
- [api_contract.md](../api_contract.md) — HTTP endpoints per pipeline
