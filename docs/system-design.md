# System Design — Community Hero (CIVICPULSE AI)

This document captures **Section 20 (System Design Principles)**, **Section 25 (Performance & Caching L1–L5)**, and **Section 29 (ML & AI Models A–G)** from the Community Hero Master Plan, mapped to the shipped implementation in this repository.

**Production:** https://community-hero-987477089222.asia-south1.run.app  
**GCP project:** `community-hero-vibe2ship` · **Region:** `asia-south1`

---

## Table of contents

1. [Section 20 — System design principles](#section-20--system-design-principles)
2. [Section 25 — Performance & caching (L1–L5)](#section-25--performance--caching-l1l5)
3. [Section 29 — ML & AI models (A–G)](#section-29--ml--ai-models-ag)
4. [Data model summary](#data-model-summary)
5. [Auth & security cross-reference](#auth--security-cross-reference)
6. [Latency budget](#latency-budget)
7. [Error handling & honest UX](#error-handling--honest-ux)
8. [References](#references)

---

## Section 20 — System design principles

### 20.1 Modular pipeline architecture

Each civic subsystem is implemented as a **self-contained pipeline** with a narrow contract: accept normalized context, produce a structured envelope, persist side effects through Firestore Admin SDK.

| Pipeline | Location | Responsibility |
|----------|----------|----------------|
| **Intake** | `server/src/routes/reports.ts` + `agents.ts` | Validate multipart body (Zod), upload media, create `issues/{id}` |
| **Vision** | `server/src/lib/gemini.ts` | Gemini structured JSON → `IssueAnalysis` |
| **Geo** | `server/src/lib/geo.ts` | Reverse geocode, `deriveWardId`, haversine distance |
| **Routing** | `server/src/lib/agents.ts` | Category → `DEPARTMENTS` map, SLA deadline |
| **Verification** | `processUpvote` in `agents.ts` | Tiered community verification (1 / 3 / 10 votes) |
| **Insights** | `server/src/routes/analytics.ts` | Summary, hotspots, trends |
| **Notification** | `notifyStatusChange` in `agents.ts` | Push-style in-app notifications collection |

The **orchestrator** is `runAgentPipeline()` — it chains intake metadata, vision output, routing, dedup, and priority scoring in one server-side call after `POST /api/reports`.

Design rule: new issue types or departments are added by extending `CATEGORIES` and `DEPARTMENTS` in `server/src/types/shared.ts` without rewriting HTTP handlers.

### 20.2 Separation of concerns

| Layer | Path | Role |
|-------|------|------|
| **Routes** | `server/src/routes/` | HTTP, Zod validation, auth guards, response formatting |
| **Agents** | `server/src/lib/agents.ts` | Workflow nodes with deterministic edges (confidence gate, dedup branch) |
| **Services** | `server/src/lib/gemini.ts`, `geo.ts`, `open311.ts` | External APIs and pure transforms |
| **Middleware** | `server/src/middleware/` | `requireAuth`, in-memory rate limits |
| **Client API** | `frontend/src/lib/api.ts` | Attach Firebase Bearer token to `/api/*` |
| **Auth state** | `frontend/src/lib/auth.tsx` | Firebase Google Sign-In, session context |
| **Pages** | `frontend/src/pages/` | 18 routes per Section 22 |

Server never trusts client-side AI labels without re-validation or explicit `analysis` JSON from a prior `/analyze` call. Client bundles contain **no** `GEMINI_API_KEY` or unrestricted Maps server key.

### 20.3 Data integrity over convenience

1. **Provenance tagging** — Every AI-derived field lives under `aiMetadata.analysis` with implicit `data_source: ai`. User edits in the wizard override display fields but preserve original analysis for audit.
2. **Confidence gate** — If Gemini `confidence < 0.6`, `runAgentPipeline` sets `status: Draft` and `aiMetadata.needs_review: true`. Issues are hidden from public map queries via `isPublicIssue()` filter.
3. **GPS fallback** — Report wizard requires either HTML5 geolocation or manual pin drop before submit (Section 20.3). Server stores `lat`, `lng`, `geohash`, `wardId`.
4. **Demo labeling** — Seed scripts set `isDemo: true` and `wardId: DEMO_WARD_001` (Appendix R) so judges can distinguish synthetic data.
5. **No fabricated locations** — Reverse geocode failures fall back to coordinate string + geohash-derived ward, never a fake street name.
6. **Idempotent votes** — `issues/{id}/votes/{uid}` document ID prevents double-counting upvotes.

### 20.4 Honest empty states

| Surface | Empty condition | UX (Section 20.4) |
|---------|-----------------|-------------------|
| Map explorer | No issues in viewport | “Be the first reporter in this area” + CTA to `/report` |
| My reports | User has zero issues | Empty list with report CTA, not infinite spinner |
| Issue analyze | Invalid / blank image | `InvalidMediaCard` with retake guidance (`frontend/src/components/civic/InvalidMediaCard.tsx`) |
| Admin queue | No open issues | “All clear in your ward” with last resolved stat |
| Leaderboard | No opt-in users | Explain opt-in; show sample badges |
| Assistant | No nearby issues | Model instructed to say “none found” — never invent IDs |
| Dashboard hotspots | Sparse ward | Show zero-state card, not broken chart |

Loading states use skeletons; hard failures use error boundaries on async routes (Phase 14).

### 20.5 Agentic workflow design

Six agents run on report submit (see diagram `04-agent-workflow.mmd`):

1. **Intake** — Persist base document, geohash precision 7, initial status `Submitted`.
2. **Vision** — Already completed pre-submit via `/analyze`; pipeline reuses or re-runs analysis.
3. **Routing** — Maps category → department name + Open311 service code.
4. **SLA** — `slaDeadline` from severity-indexed hours in `DEPARTMENTS[category].slaHours`.
5. **Dedup** — Geohash prefix query (precision 6) + same category filter → `duplicate_suggestions`.
6. **Priority** — `computePriorityScore` (Model G) written to issue doc.

Post-submit: **Verification agent** (`processUpvote`), **Notify agent** (`notifyStatusChange`), **Gamification** (`awardPoints`).

Conditional edges:

- `confidence < 0.6` → Draft branch (skip auto-publish semantics).
- `dupes.length > 0` → merge UX payload on client, no auto-merge without user consent.

---

## Section 25 — Performance & caching (L1–L5)

LogiFlow-grade tiered caching adapted for civic workloads. Target: **P95 full submit < 5s** on 4G (Section 4.3).

### L1 — RequestContext (per-request cache)

**Scope:** Single HTTP request lifecycle.

| Cached item | Mechanism | Benefit |
|-------------|-----------|---------|
| Reverse geocode | `reverseGeocodeServer(lat, lng)` called once in report create | Avoid duplicate Maps bill if agents need address |
| Parsed `IssueAnalysis` | Body may include pre-analyzed JSON from wizard step 2 | Skip second Gemini call when `ai_analyzed=true` |
| Auth user | `requireAuth` attaches `req.user` once | Shared across handlers |

Implementation: local variables in route handlers; no cross-request store. Future: explicit `RequestContext` object passed to agents.

### L2 — In-memory Gemini cache

**File:** `server/src/lib/geminiCache.ts`

| Setting | Value |
|---------|-------|
| Key | SHA-256 of image buffer |
| TTL | 1 hour |
| Max entries | 200 (LRU eviction) |
| Scope | `/api/reports/analyze` and duplicate re-upload |

Cache hit reduces vision latency from ~2s to <50ms on identical bytes (demo re-submits, QA loops).

### L3 — Redis optional (analytics & rate limits)

**Current:** In-memory `Map` in `server/src/middleware/rateLimit.ts` for report/upvote/chat limits.

**Stretch:** Redis for:

- Rate limit counters across Cloud Run instances (min-instances > 1).
- `GET /api/analytics/summary` response cache — **15 minute TTL** (Section 25).
- Hotspot grid cache keyed by `wardId`.

Production demo runs single-instance; in-memory limits sufficient for hackathon scale.

### L4 — Firestore pre-aggregation

| Collection | Purpose |
|------------|---------|
| `analytics_daily/{date}` | Pre-aggregated counts by category, resolved count, avg resolution hours |
| `hotspots/{geohash}` | Model D risk scores, updated on write or batch job |

Dashboard reads aggregates first; raw `issues` collection scan limited to 100 docs for hotspot fallback in `routes/analytics.ts`.

**Index strategy:** Composite indexes in `firestore.indexes.json` for `(status, createdAt desc)`, `(category, geohash)`, `(wardId, status)`.

### L5 — Static assets

| Asset | Location | Cache |
|-------|----------|-------|
| Ward boundary GeoJSON | `/public/wards/` stretch | `Cache-Control: max-age=86400` |
| Category taxonomy | `shared/types.ts` + `DEPARTMENTS` | Bundled at build |
| Demo seed images | Unsplash URLs in seed script | External CDN |
| SPA bundle | `frontend/dist` via Express static | Cloud Run + browser cache |

Cloud Storage report images use public URLs with long cache headers where signed URLs allow.

### Parallel execution patterns

```text
POST /api/reports:
  Promise.all([ uploadToStorage(), reverseGeocode() ])  // parallel I/O
  → runAgentPipeline()                                 // sequential agents
  → upsertThreadForIssue()                             // async cluster update
```

Early exit: duplicate suggestions do not block create — user may merge later.

### Reduced Gemini usage

| Feature | Default | Gemini when |
|---------|---------|-------------|
| Status timeline messages | Template strings by status | “Detailed mode” stretch |
| Thread summaries | Rule-based title from category | Batch Model B lite |
| Dashboard insight card | Aggregates only | Optional narrative in `/trends` |
| Vision classify | Always (Model A) | — |
| Civic assistant | Tool-grounded chat | Every message (Model B lite) |

---

## Section 29 — ML & AI models (A–G)

### Model A — Gemini Vision Classifier (primary)

| Attribute | Value |
|-----------|-------|
| Model | `gemini-2.0-flash` (via `@google/generative-ai`) |
| Input | Image buffer + optional text hint |
| Output | Structured `IssueAnalysis`: category, severity 1–5, title, description, department, safety_risk, confidence |
| Latency target | < 2s P95 |
| Validation | Zod + category enum guard; invalid → `INVALID_MEDIA` |
| Endpoint | `POST /api/reports/analyze`, re-used on create |

**Prompt design:** Strict JSON schema; 9 categories from `CATEGORIES`; never return markdown fences.

**Accuracy target:** > 90% on demo ward set (Appendix R categories).

### Model B — Gemini Flash Lite (narrative)

| Use case | Location |
|----------|----------|
| Civic assistant chat | `server/src/routes/ai.ts` + `chatWithTools` |
| Dashboard trend prose | `GET /api/analytics/trends` |
| Thread summary stretch | `threads` route |

Cost-optimized for high-token batch and conversational replies. Tool calling grounds answers in Firestore — **never invent issue IDs**.

### Model C — Embeddings (duplicate detection stretch)

| Attribute | Value |
|-----------|-------|
| Model | `gemini-embedding-001` (768-dim) |
| Threshold | Cosine similarity ≥ 0.85 within 50m |
| MVP fallback | Geohash-6 + same category query in `findDuplicates()` |

Embedding path documented for post-hackathon Vertex AI fine-tuning; geohash dedup ships in MVP.

### Model D — HotspotScorer v1 (rule-based)

| Factor | Weight |
|--------|--------|
| Geohash-5 cell density | Issue count in cell |
| Severity | Higher severity → higher risk |
| Recency decay | Exponential decay over 14 days |

Implemented in `GET /api/analytics/hotspots` — no training required. Output: `{ geohash, count, risk_score, categories[] }`.

### Model E — SLA Predictor v1

| Source | Fallback |
|--------|----------|
| Historical `avgResolutionHours` from `analytics_daily` | `DEPARTMENTS[category].slaHours[severity]` table |

`slaDeadline` computed at routing agent: `now + slaHours * 3600000`.

**SLA matrix (hours):**

| Category | Sev 5 | Sev 4 | Sev 3 | Sev 2 | Sev 1 |
|----------|-------|-------|-------|-------|-------|
| pothole / road_damage | 24 | 48 | 72 | 120 | 168 |
| water_leak / drainage | 12 | 24 | 48 | 72 | 120 |
| streetlight | 24 | 48 | 72 | 96 | 168 |
| waste | 24 | 48 | 72 | 96 | 168 |

### Model F — Before/After Matcher (stretch)

Compare `proofImageUrl` to original `imageUrls[0]` via Gemini multimodal compare. Confidence > 0.8 → auto-accept resolution without admin review.

Not required for MVP; admin manual proof upload ships in `/admin`.

### Model G — Priority Score Formula

**Canonical formula (Section 29):**

```text
priority = severity*0.4 + upvoteCount*0.2 + safety_risk*0.3 + age_days*0.1
(normalized 0–100)
```

**Implementation** (`server/src/lib/agents.ts` — routing agent):

```typescript
(severity / 5) * 40 +
Math.min(upvoteCount / 20, 1) * 20 +
(safetyRisk ? 30 : 0) +
Math.min(ageDays / 14, 1) * 10
```

**Unit tests:** `server/src/lib/priority.test.ts` (simplified 3-factor variant in `priority.ts` for isolated formula tests).

Priority recomputed on each upvote in `processUpvote`.

### Training data strategy (post-hackathon)

Log admin corrections to `aiMetadata.corrections[]` when category/severity overridden. Export to BigQuery → Vertex AI fine-tune on civic image taxonomy.

### Evaluation metrics

| Metric | Target |
|--------|--------|
| Classification accuracy | > 90% demo set |
| Duplicate precision | > 85% (geohash + category) |
| P95 submit latency | < 4–5s |
| Vision cache hit rate | > 20% during QA |

---

## Data model summary

### Firestore collections

| Collection | Key fields |
|------------|------------|
| `users/{uid}` | displayName, email, civicPoints, badges[], wardId, createdAt |
| `issues/{id}` | title, category, severity, status, lat, lng, geohash, wardId, reporterId, departmentId, upvoteCount, verificationLevel, priorityScore, slaDeadline, imageUrls[], aiMetadata{}, isDemo |
| `issues/{id}/events` | type, actorId, payload, timestamp |
| `issues/{id}/votes/{uid}` | createdAt |
| `threads/{id}` | issueIds[], title, summary, geohashPrefix, count |
| `departments/{id}` | name, categories[], slaHoursBySeverity{}, serviceCodes[] |
| `notifications/{id}` | userId, issueId, type, title, body, read |
| `health_checks/{id}` | status, timestamp (Phase 1 probe) |

See `docs/diagrams/mermaid/08-firestore-schema.mmd` for ERD.

### Auth

Firebase Google Sign-In; client obtains ID token; server `requireAuth` verifies via Firebase Admin. Firestore rules: public read on non-draft issues; authenticated create; vote doc owner = uid.

---

## Auth & security cross-reference

See `docs/diagrams/mermaid/14-security-layers.mmd` and Section 26:

- Rate limits: 10 reports/day, 30 upvotes/hour, 20 chat/min.
- Upvote eligibility: account age > 24h **OR** ≥ 1 prior report.
- Admin: `ADMIN_EMAILS` / `ADMIN_UIDS` env vars.
- Secrets server-side only (Appendix N).

---

## Latency budget

| Step | Target |
|------|--------|
| Client compress + GPS | User-paced |
| POST /analyze | 1–3s |
| POST /reports (upload + agents) | 2–5s |
| Map listener update | < 1s realtime |
| Dashboard summary (cached) | < 500ms |

---

## Error handling & honest UX

Consistent JSON errors via `server/src/lib/errors.ts`:

| Code | HTTP | When |
|------|------|------|
| `INVALID_MEDIA` | 400 | Bad image / not civic |
| `NEEDS_REVIEW` | 202 | Low confidence create |
| `RATE_LIMIT` | 429 | Limits exceeded + `Retry-After` |
| `FORBIDDEN` | 403 | Upvote ineligible / not admin |
| `NOT_FOUND` | 404 | Missing issue |

429/503 → client may redirect to `/waiting` (LogiFlow pattern).

---

## Appendix — Pipeline registry pattern (Section 20.1 stretch)

Future refactors can register pipelines in `server/src/pipelines/registry.ts`:

```typescript
type CivicPipeline = {
  name: string
  run: (ctx: PipelineContext) => Promise<Partial<IssueEnvelope>>
}

const registry: CivicPipeline[] = [
  { name: 'intake', run: runIntakeAgent },
  { name: 'vision', run: runVisionAgent },
  // ...
]
```

Current MVP inlines orchestration in `runAgentPipeline()` for hackathon velocity; registry pattern documented for post-submit maintainability.

---

## Appendix — Firestore index reference (Section 28)

Composite indexes in `firestore.indexes.json`:

| Collection | Fields | Query use |
|------------|--------|-----------|
| `issues` | `status` ASC, `createdAt` DESC | Admin queue, recent open |
| `issues` | `category` ASC, `geohash` ASC | Dedup neighbor scan |
| `issues` | `wardId` ASC, `status` ASC | Ward dashboard filter |
| `issues` | `reporterId` ASC, `createdAt` DESC | My reports page |

Geohash range queries use string inequality on `geohash` field with `\uf8ff` upper bound (Firestore lexicographic trick).

---

## Appendix — Model selection quick reference (Appendix B)

| Task | Model | Rationale |
|------|-------|-----------|
| Vision classify | gemini-2.0-flash | Structured JSON, <2s latency |
| Chat + tools | gemini-2.0-flash-lite | Cost-efficient, high volume |
| Embeddings | gemini-embedding-001 | 768-dim dedup stretch |
| Trend narrative | flash-lite | Batch dashboard copy |
| Before/after proof | flash multimodal | Model F stretch |

Never use `flash-image` for JSON mode — use standard flash with `responseSchema` (Section 16 risk mitigation).

---

## Appendix — Observability (production)

| Signal | Source |
|--------|--------|
| Liveness | `GET /api/health` — `scripts/uptime-ping.sh` |
| Phase regression | `scripts/verify-phases.sh` |
| CI | `.github/workflows/ci.yml` + `deploy.yml` |
| Cloud Run logs | `gcloud run services logs read community-hero` |

Structured log fields recommended: `issueId`, `agent`, `latencyMs`, `confidence`, `cacheHit`.

---

## References

| Document | Path | Scope |
|----------|------|-------|
| Architecture | [`architecture.md`](architecture.md) | Routes, agents, Firestore model, deployment summary |
| API contract | [`api_contract.md`](api_contract.md) | REST endpoints, auth, rate limits |
| Deployment | [`deployment.md`](deployment.md) | GCP/Firebase setup, env vars, CI/CD |
| Diagrams index | [`diagrams/README.md`](diagrams/README.md) | 16 mermaid sources + PNG exports |
| Docs index | [`README.md`](README.md) | Phase 15 documentation hub |
| Phase tracker | [`PHASE-COMPLETION-TRACKER.md`](PHASE-COMPLETION-TRACKER.md) | Phases 0–19 evidence |

---

## Document history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | Phase 15 | Sections 20, 25, 29 expanded for LogiFlow parity |
| 1.2 | Phase 15 | Added References section (TOC link fix); synced deployment topology alias |

