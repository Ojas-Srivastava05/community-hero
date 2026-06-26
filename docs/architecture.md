# Architecture — Community Hero

Community Hero (CIVICPULSE AI) is a hyperlocal civic issue reporting platform built for the Vibe to Ship hackathon. Residents photograph problems, AI triages and routes them to departments, neighbors upvote to verify, and admins close the loop.

## Repository layout

```
Vibe2Ship/
├── frontend/          React 19 + Vite + Tailwind (Civic Glass UI)
├── server/            Express 5 API + agent pipeline
├── shared/types.ts    Shared TypeScript types (mirrored in server)
├── scripts/           Deploy, seed, verify
├── docs/              API contract, architecture, deployment
└── firebase.json      Firestore rules, indexes
```

Production ships as a **single Cloud Run container**: Express serves `/api/*` and static `frontend/dist` for the SPA.

## System diagram

See [`docs/diagrams/mermaid/01-system-architecture.mmd`](diagrams/mermaid/01-system-architecture.mmd).

```
[Browser PWA] ──Bearer token──► [Express on Cloud Run]
       │                              │
       ├─ Firebase Auth (client)       ├─ Firebase Admin → Firestore / Storage
       └─ Google Maps (tiles)          └─ Gemini API (vision + chat)
```

## Frontend

| Area | Path | Role |
|------|------|------|
| Landing | `/` | Marketing, sign-in CTA |
| Report wizard | `/report` | Photo → AI analyze → submit |
| Map explorer | `/map` | Issues on map (or list fallback) |
| Issue detail | `/issues/:id` | Timeline, upvote, merge |
| Dashboard | `/dashboard` | Analytics summary + hotspots |
| Activity | `/activity` | Thread clusters |
| Assistant | `/assistant` | Gemini civic chat |
| Admin | `/admin` | Status updates, proof upload |
| Leaderboard | `/leaderboard` | Civic points ranking |

**Stack:** React Router 7, Firebase Auth SDK, `@react-google-maps/api`, Framer Motion, Recharts.

Auth state lives in `frontend/src/lib/auth.tsx`. API calls attach the Firebase ID token via `frontend/src/lib/api.ts`.

## Backend routes

Mounted in `server/src/index.ts`:

| Prefix | Module | Purpose |
|--------|--------|---------|
| `/api/health` | index | Liveness + Firestore probe |
| `/api/reports` | `routes/reports.ts` | CRUD, analyze, upvote, merge, admin status |
| `/api/analytics` | `routes/analytics.ts` | Summary, hotspots, Open311 export |
| `/api/ai` | `routes/ai.ts` | Civic assistant chat |
| `/api/geo` | `routes/geo.ts` | Reverse geocoding |
| `/api/leaderboard` | `routes/leaderboard.ts` | Top reporters |
| `/api/threads` | `routes/threads.ts` | Geohash issue clusters |
| `/api/users` | `routes/users.ts` | Profile upsert / read |

**Middleware:** `requireAuth` verifies Firebase ID tokens; `rateLimit` guards reports, upvotes, and chat.

## Agent pipeline

Orchestrated in `server/src/lib/agents.ts` after each new report:

1. **Intake** — Issue saved to Firestore with geohash and ward.
2. **Vision** — Gemini classifies photo (via `/api/reports/analyze` before submit).
3. **Routing** — Maps category → department (`DEPARTMENTS` in `types/shared.ts`).
4. **SLA** — Computes `slaDeadline` from severity-tiered hours per department.
5. **Dedup** — Geohash range query suggests nearby same-category issues.
6. **Priority** — `computePriorityScore(severity, safety_risk, confidence)` in `lib/priority.ts`.

Low confidence (`< 0.6`) sets status `Draft` and `aiMetadata.needs_review`.

**Upvote agent logic** (`processUpvote`):

- 1+ upvotes → `verificationLevel` 1
- 3+ upvotes → level 2, status `Community Verified`, +15 pts to reporter
- 10+ upvotes → level 3

**Points** (`awardPoints`): report +10, upvote +5, merge +15, resolved +25. Badges e.g. `First Reporter`.

## Firebase data model

### `issues/{issueId}`

| Field | Description |
|-------|-------------|
| `title`, `description`, `category`, `severity` | Report content |
| `status` | Workflow state |
| `lat`, `lng`, `geohash`, `wardId`, `address` | Location |
| `reporterId`, `reporterEmail` | Owner |
| `departmentId`, `slaDeadline`, `priorityScore` | Agent output |
| `upvoteCount`, `verificationLevel` | Community verification |
| `imageUrls`, `proofImageUrl` | Storage URLs |
| `aiMetadata` | Agents run, duplicates, review flags |
| `createdAt`, `updatedAt`, `resolvedAt` | Timestamps |

**Subcollections:**

- `issues/{id}/events` — Timeline (`ai_analysis`, `routing`, `upvote`, `merge`, `status_change`, `reopen`)
- `issues/{id}/votes/{uid}` — One vote per user

### `users/{uid}`

`displayName`, `email`, `photoURL`, `civicPoints`, `badges`, timestamps.

### `threads/{threadId}`

Geohash-prefix clusters (`thread-{geohash5}`): `issueIds[]`, `title`, `summary`, `count`.

### Cloud Storage

`issues/{issueId}/{uuid}.{ext}` — report photos; `issues/{id}/proof.{ext}` — resolution proof.

## External services

| Service | Usage |
|---------|--------|
| Firebase Auth | Google sign-in; ID tokens for API |
| Cloud Firestore | Primary database |
| Cloud Storage | Report images and proof |
| Gemini (`@google/generative-ai`) | Image analysis, dashboard insight, assistant chat |
| Google Maps Geocoding | Reverse geocode (server + optional client tiles) |

## Deployment topology

| Component | Target |
|-----------|--------|
| GCP project | `community-hero-vibe2ship` |
| Region | `asia-south1` |
| Cloud Run service | `community-hero` |
| URL | `https://community-hero-987477089222.asia-south1.run.app` |
| Container | `gcr.io/community-hero-vibe2ship/community-hero:latest` |
| Build | `cloudbuild.yaml` → Docker multi-stage (frontend build + server) |

Cloud Run listens on `PORT` (8080 in prod, 3001 locally). `NODE_ENV=production` enables static SPA fallback.

Firestore security rules (`firestore.rules`) allow public read on issues; writes require auth. Server uses Admin SDK and bypasses rules for privileged operations.

## Local development

```bash
make install
# Terminal 1: cd server && npm run dev   # :3001
# Terminal 2: cd frontend && npm run dev  # :5173 (proxies /api)
```

Or `npm run dev` from root (concurrently).

## CI & quality

- **GitHub Actions** (`.github/workflows/ci.yml`): frontend build, server `tsc`, priority unit test.
- **Makefile:** `make test`, `make lint`, `make health` (local `/api/health`).
- **API contract:** `docs/api_contract.md`.

## References

- Master plan: `Community-Hero-Master-Plan.pdf`
- Phase plan: `Community-Hero-Phase-Development-Plan.pdf`
- Deployment checklist: `docs/deployment.md`
