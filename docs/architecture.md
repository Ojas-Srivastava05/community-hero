# Architecture — Community Hero (CIVICPULSE AI)

Community Hero is a hyperlocal civic issue reporting platform built for the **Vibe to Ship / BlockseBlock 2026** hackathon (Problem Statement 2). Residents photograph infrastructure problems, AI triages and routes them to municipal departments, neighbors upvote to verify, and admins close the loop with proof photos.

**Codename:** CIVICPULSE AI  
**Production:** https://community-hero-987477089222.asia-south1.run.app  
**Repository:** https://github.com/Ojas-Srivastava05/community-hero

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [Repository layout](#repository-layout)
3. [System architecture](#system-architecture)
4. [Frontend architecture (18 routes)](#frontend-architecture-18-routes)
5. [Backend architecture](#backend-architecture)
6. [Agent pipeline](#agent-pipeline)
7. [Civic pipelines](#civic-pipelines)
8. [Firebase data model](#firebase-data-model)
9. [External services](#external-services)
10. [Deployment topology](#deployment-topology)
11. [CI/CD & automation](#cicd--automation)
12. [Local development](#local-development)
13. [Diagram index](#diagram-index)
14. [References](#references)

---

## Executive summary

Community Hero combines **Swachhata-grade community participation**, **InfraGuard-grade AI vision speed**, and **CivicThreads-grade geohash clustering** into a single Cloud Run deployment. The core loop:

```text
Photo + GPS → Gemini classify → Firestore issue → Map pin
  → Community upvote → Department routing → Resolution + proof
```

Differentiators vs municipal WhatsApp groups and legacy portals:

- **3-second AI triage** — structured JSON from Gemini Vision, not free-text forms.
- **6-agent orchestration** — routing, SLA, dedup, priority without manual desk triage.
- **Verification tiers** — crowd truth at 1 / 3 / 10 upvotes reduces duplicate noise (~40% target).
- **Public accountability** — named status timeline on every issue.
- **Open311 export** — enterprise-ready GeoReport v2 adapter.

---

## Repository layout

```text
Vibe2Ship/
├── frontend/                 React 19 + Vite + Tailwind (Civic Glass UI)
│   ├── src/pages/            18 route components
│   ├── src/components/civic/ Shared UI (GlassCard, SeverityBadge, …)
│   └── src/lib/              auth.tsx, api.ts, firebase.ts
├── server/                   Express 5 API + agent pipeline
│   ├── src/routes/           reports, analytics, ai, geo, threads, …
│   ├── src/lib/              agents, gemini, geo, open311, priority
│   ├── src/middleware/       auth, rateLimit
│   └── scripts/              seed-firestore.ts, seed-departments.ts
├── shared/types.ts           Shared TypeScript types (mirrored in server)
├── scripts/                  deploy, seed, verify, render-diagrams
├── docs/                     architecture, system-design, deployment, diagrams
├── .github/workflows/        ci.yml, deploy.yml
├── firebase.json             Firestore rules, indexes
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── cloudbuild.yaml           Docker multi-stage build
├── Dockerfile
└── Makefile                  dev, build, test, seed-all, deploy, diagrams
```

Production ships as a **single Cloud Run container**: Express serves `/api/*` and static `frontend/dist` for the SPA (same-origin, no CORS friction for auth).

---

## System architecture

See [`docs/diagrams/mermaid/01-system-architecture.mmd`](diagrams/mermaid/01-system-architecture.mmd) and PNG export.

```text
┌─────────────────┐     Bearer token      ┌──────────────────────────────┐
│  Browser PWA    │ ────────────────────► │  Cloud Run — community-hero  │
│  React + Vite   │     REST /api/*       │  Express :8080               │
│  Firebase Auth  │                       │  ├─ API routes               │
│  Google Maps JS │                       │  ├─ Agent pipeline           │
└────────┬────────┘                       │  └─ Static SPA (dist/)       │
         │                                └───────────┬──────────────────┘
         │ Firebase Auth SDK                          │
         ▼                                            ▼
┌─────────────────┐                       ┌──────────────────────────────┐
│ Firebase Auth   │                       │ Firebase Admin SDK           │
└─────────────────┘                       │ ├─ Firestore (issues, users) │
                                          │ ├─ Cloud Storage (images)    │
                                          │ └─ Token verification        │
                                          └───────────┬──────────────────┘
                                                      │
                              ┌───────────────────────┼───────────────────────┐
                              ▼                       ▼                       ▼
                       Gemini API            Maps Geocoding            (Open311 export)
                       vision + chat         reverse geocode
```

**Latency path:** Client compresses image → `POST /analyze` (1–3s) → user confirms → `POST /reports` (2–5s upload + agents) → Firestore realtime listener updates map.

---

## Frontend architecture (18 routes)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Landing | Hero, live stats, sign-in CTA |
| `/report` | ReportWizard | 3-step: photo → AI analyze → submit |
| `/map` | MapExplorer | Clustered markers + list fallback |
| `/issues/:id` | IssueDetail | Timeline, upvote, merge, share |
| `/my-reports` | MyReports | Reporter’s issues + SLA countdown |
| `/dashboard` | Dashboard | KPIs, Recharts, hotspots, AI insight |
| `/leaderboard` | Leaderboard | Civic points ranking (opt-in) |
| `/assistant` | Assistant | Gemini chat with tool calling |
| `/admin` | Admin | Status updates, proof upload |
| `/admin/analytics` | AdminAnalytics | Ward exports, SLA breaches |
| `/threads/:id` | ThreadDetail | Geohash issue cluster forum |
| `/activity` | Activity | Thread list / activity feed |
| `/login` | Login | Google Sign-In |
| `/profile` | Profile | Badges, points, preferences |
| `/terms` | Legal | Terms of service |
| `/privacy` | Legal | Privacy policy |
| `/waiting` | WaitingRoom | Branded 429/503 retry countdown |
| `*` | NotFound | 404 fallback |

**Stack:** React Router 7, Firebase Auth SDK, `@react-google-maps/api`, Framer Motion, Recharts.

**State management:**

- Auth: React context in `frontend/src/lib/auth.tsx`
- API: `frontend/src/lib/api.ts` attaches Firebase ID token
- Page-local state + fetch; Zustand stores per Section 22 stretch goal

**Design system:** Civic Glass — dark map-first, teal accent `#14B8A6` (see `.stitch/DESIGN.md`).

**PWA:** Mobile-first responsive; service worker + manifest stretch (diagram `15-mobile-pwa-architecture.mmd`).

---

## Backend architecture

**Entry:** `server/src/index.ts` mounts routers and serves static SPA in production.

| Prefix | Module | Purpose |
|--------|--------|---------|
| `/api/health` | index | Liveness + Firestore probe |
| `/api/reports` | `routes/reports.ts` | CRUD, analyze, upvote, merge, admin status |
| `/api/analytics` | `routes/analytics.ts` | Summary, hotspots, trends, Open311 export |
| `/api/ai` | `routes/ai.ts` | Civic assistant chat + tools |
| `/api/geo` | `routes/geo.ts` | Reverse geocoding proxy |
| `/api/leaderboard` | `routes/leaderboard.ts` | Top reporters |
| `/api/threads` | `routes/threads.ts` | Geohash issue clusters |
| `/api/users` | `routes/users.ts` | Profile upsert / read |
| `/api/departments` | `routes/departments.ts` | Department catalog |

**Middleware chain:**

1. CORS (dev)
2. JSON / multipart parsers
3. `requireAuth` on protected routes
4. `rateLimit` — reports (10/day), upvotes (30/hr), chat (20/min)
5. Zod validation on request bodies
6. Centralized errors via `sendError()` + Appendix W codes

**Static serving:** When `NODE_ENV=production`, Express serves `frontend/dist` with SPA fallback for non-API routes.

---

## Agent pipeline

Orchestrated in `server/src/lib/agents.ts` after each new report. Diagram: [`04-agent-workflow.mmd`](diagrams/mermaid/04-agent-workflow.mmd).

| Agent | Trigger | Output |
|-------|---------|--------|
| Intake | POST /reports | Base doc, geohash-7, wardId |
| Vision | /analyze or create | IssueAnalysis JSON |
| Routing | After vision | departmentId, Open311 code |
| SLA | After routing | slaDeadline ISO timestamp |
| Dedup | After SLA | duplicate_suggestions[] |
| Priority | Final | priorityScore 0–100 |
| Gamification | After create | +10 pts, First Reporter badge |
| Verification | POST upvote | verificationLevel 1/2/3 |
| Notify | Status change | notifications + events |

**Confidence gate:** `confidence < 0.6` → `status: Draft`, `aiMetadata.needs_review: true`.

**Upvote tiers:**

- 1+ votes → verificationLevel 1
- 3+ votes → level 2, status `Community Verified`, +15 pts reporter
- 10+ votes → level 3

---

## Civic pipelines

Section 23 — nine pipelines at a glance:

| # | Pipeline | Phase | Key file |
|---|----------|-------|----------|
| 1 | Intake | 2 | `routes/reports.ts` |
| 2 | Vision | 2 | `lib/gemini.ts` |
| 3 | Geo | 3 | `lib/geo.ts` |
| 4 | Verification | 5 | `agents.ts` processUpvote |
| 5 | Routing | 6 | `agents.ts` runAgentPipeline |
| 6 | Notification | 7 | notifyStatusChange |
| 7 | Analytics | 8 | `routes/analytics.ts` |
| 8 | Insights / hotspots | 9 | HotspotScorer v1 |
| 9 | Open311 export | 12 | `lib/open311.ts` |

Report lifecycle (Section 24 — 10 steps): capture → analyze → validate → upload → geocode → agents → Firestore write → realtime UI → gamification → notify.

Sequence diagram: [`05-report-intake.mmd`](diagrams/mermaid/05-report-intake.mmd).

---

## Firebase data model

### `issues/{issueId}`

| Field | Description |
|-------|-------------|
| `title`, `description`, `category`, `severity` | Report content |
| `status` | Draft → Submitted → Community Verified → Assigned → In Progress → Resolved |
| `lat`, `lng`, `geohash`, `wardId`, `address` | Location |
| `reporterId`, `reporterEmail` | Owner |
| `departmentId`, `slaDeadline`, `priorityScore` | Agent output |
| `upvoteCount`, `verificationLevel` | Community verification |
| `imageUrls`, `proofImageUrl` | Storage URLs |
| `aiMetadata` | agents[], analysis, needs_review, duplicate_suggestions |
| `isDemo` | Seed data flag (Appendix R) |
| `createdAt`, `updatedAt`, `resolvedAt` | Timestamps |

**Subcollections:**

- `issues/{id}/events` — Timeline (`ai_analysis`, `routing`, `upvote`, `merge`, `status_change`, `reopen`, `notify`)
- `issues/{id}/votes/{uid}` — One vote per user (idempotent)

### `users/{uid}`

`displayName`, `email`, `photoURL`, `civicPoints`, `badges[]`, `wardId`, timestamps.

### `threads/{threadId}`

Geohash-prefix clusters (`thread-{geohash5}`): `issueIds[]`, `title`, `summary`, `count`.

### `departments/{id}`

Seeded via `server/scripts/seed-departments.ts` — categories, SLA hours, Open311 codes.

### Cloud Storage

- `issues/{issueId}/{uuid}.{ext}` — report photos
- `issues/{id}/proof.{ext}` — resolution proof

ERD: [`08-firestore-schema.mmd`](diagrams/mermaid/08-firestore-schema.mmd).

**Security rules:** Public read on non-draft issues; authenticated creates; admin status via server Admin SDK.

---

## External services

| Service | Usage |
|---------|--------|
| Firebase Auth | Google sign-in; ID tokens for API |
| Cloud Firestore | Primary database + realtime listeners |
| Cloud Storage | Report images and proof |
| Gemini (`@google/generative-ai`) | Image analysis, trends narrative, assistant chat |
| Google Maps Geocoding | Reverse geocode (server); JS API for map tiles (client) |

API keys: **server-side only** for Gemini and Maps geocoding. Client uses restricted Maps JS key in `VITE_GOOGLE_MAPS_API_KEY`.

---

## Deployment topology

| Component | Target |
|-----------|--------|
| GCP project | `community-hero-vibe2ship` |
| Region | `asia-south1` |
| Cloud Run service | `community-hero` |
| URL | https://community-hero-987477089222.asia-south1.run.app |
| Container | `gcr.io/community-hero-vibe2ship/community-hero:latest` |
| Build | `cloudbuild.yaml` → Docker multi-stage (frontend build + server) |
| Preview | Vercel `community-hero-eight.vercel.app` (optional) |

Diagram: [`12-deployment.mmd`](diagrams/mermaid/12-deployment.mmd).

Cloud Run profile: 1 CPU, 512Mi RAM, port 8080, min-instances 0 (Starter) or 1 (demo warm).

Firebase Auth authorized domain must include `community-hero-987477089222.asia-south1.run.app`.

---

## CI/CD & automation

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | push/PR main | npm ci, frontend build, server tsc, npm test |
| `deploy.yml` | push main | Cloud Build + Cloud Run deploy (see secrets in deployment.md) |

**Makefile targets:**

| Target | Command |
|--------|---------|
| `make install` | npm install frontend + server |
| `make build` | Production frontend + server typecheck |
| `make test` | Server unit + integration tests |
| `make seed-all` | seed-firestore + seed-departments |
| `make deploy` | `scripts/deploy-cloud-run.sh` |
| `make diagrams` | `scripts/render-diagrams.sh` |
| `make verify` | Production health + reports probe |
| `make health` | Local `/api/health` |

**Phase verification:** `scripts/verify-phases.sh` — curls all phase checkpoints against Cloud Run URL.

**Uptime:** `scripts/uptime-ping.sh` — cron-friendly health monitor.

---

## Local development

```bash
make install

# Terminal 1 — API
cd server && npm run dev    # http://localhost:3001

# Terminal 2 — Frontend (proxies /api)
cd frontend && npm run dev  # http://localhost:5173
```

Or from root: `npm run dev` (concurrently).

**Seed demo data:**

```bash
make seed-all   # 25 issues + departments (requires gcloud ADC)
```

**Environment:** Copy `.env.example` → `server/.env` and `frontend/.env`.

---

## Diagram index

All 16 Section 32 diagrams in `docs/diagrams/mermaid/`:

| # | File | Topic |
|---|------|-------|
| 01 | system-architecture | End-to-end topology |
| 02 | user-journey | Citizen photo → resolved |
| 03 | report-wizard-flow | 3-step UI flowchart |
| 04 | agent-workflow | 6 agents + branches |
| 05 | report-intake | API sequence + latency |
| 06 | upvote-verification | Tier logic |
| 07 | admin-resolution | Admin + proof workflow |
| 08 | firestore-schema | ERD |
| 09 | gamification-flow | Points + badges |
| 10 | ai-assistant-tools | Chat function calling |
| 11 | open311-export | Schema mapping |
| 12 | deployment | Cloud Run + CI/CD |
| 13 | analytics-pipeline | Dashboard data flow |
| 14 | security-layers | 7 security layers |
| 15 | mobile-pwa-architecture | PWA + device APIs |
| 16 | evaluation-alignment | Hackathon criteria map |

Render PNGs: `make diagrams` or `bash scripts/render-diagrams.sh`.

---

## References

- **System design** (Sections 20, 25, 29): `docs/system-design.md`
- **API contract**: `docs/api_contract.md`
- **Deployment runbook**: `docs/deployment.md`
- **Master plan**: `Community-Hero-Master-Plan.pdf`
- **Phase plan**: `Community-Hero-Phase-Development-Plan.pdf`
- **Presentation kit**: `docs/ppt-info/slides/` (Appendix P)
- **Submission checklist**: `docs/SUBMISSION-CHECKLIST.md`
