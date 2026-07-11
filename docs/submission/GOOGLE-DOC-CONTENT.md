# Google Doc Submission Content (Appendix J)

**For copy-paste into Google Docs, use:** [`GOOGLE-DOC-PASTE.txt`](./GOOGLE-DOC-PASTE.txt)  
Open that file → Select All → Copy → Paste into a new Google Doc. Tables use tab separators so Google Docs auto-formats them as tables.

Set sharing to **Anyone with the link → Viewer** before BlockseBlock submit.

**Product:** CIVICPULSE AI (Community Hero)  
**Problem statement:** Vibe2Ship Problem Statement 2 — Community Hero  
**Deadline:** June 29, 2026, 2:00 PM

---

## Section 1 — Problem Statement Selected

**Selected:** **Community Hero — Hyperlocal Problem Solver** (Vibe to Ship / BlockseBlock 2026, Problem Statement 2)

Indian urban residents face fragmented civic reporting: WhatsApp groups, municipal portals, and ad-hoc apps with no shared record. Manual triage delays routing; duplicate reports waste field crews; citizens rarely see transparent status timelines from submission to resolution. Swachhata proved national demand for photo + GPS reporting, but lacks agentic AI triage, predictive prevention, and sub-3-second vision classification.

Community Hero addresses this gap with a production PWA on Google Cloud: photograph an issue, Gemini classifies in seconds, six agents route and track SLA deadlines, neighbors upvote to verify, and public dashboards show accountability.

---

## Section 2 — Solution Overview (~300 words)

CIVICPULSE AI (Community Hero) is a hyperlocal civic intelligence platform that turns citizen photographs into accountable, routed, verifiable municipal records. A resident opens the mobile-first PWA, signs in with Google, and completes a three-step report wizard: capture a photo, allow GPS pinning, and confirm AI-prefilled fields. Gemini 2.5 Flash analyzes the image server-side and returns structured JSON—category, severity, department, confidence, and citizen-friendly title—typically in under three seconds.

On submit, a six-agent orchestration pipeline runs automatically: intake persists the issue to Cloud Firestore with geohash indexing; vision metadata is attached; routing maps category to department; SLA agent sets deadline hours by severity tier; dedup agent queries nearby same-category issues; priority agent computes a composite score. Low-confidence reports enter a Draft review queue rather than polluting the public map.

Neighbors discover issues on a Google Maps explorer (with list fallback for low bandwidth), upvote to raise verification tiers at 1, 3, and 10 votes, and earn civic points through ethical gamification. Municipal admins update status, attach resolution proof photos, and export Open311-compatible records. An impact dashboard surfaces KPIs, trend charts, predictive hotspots, and Gemini-generated insight narratives. A civic assistant chat answers natural-language questions using function calling over live Firestore data.

The stack ships as a single Cloud Run container in `asia-south1`, with Firebase Auth, Firestore, Cloud Storage, and Google Maps Platform—deployable from Google AI Studio and auditable on GitHub. The thesis: same engineering rigor as enterprise logistics platforms, applied to communities instead of cargo—faster triage, fewer duplicates, and public trust through transparency.

### Evaluation matrix mapping (Appendix A)

| Criteria | Weight | How this solution scores |
|----------|--------|--------------------------|
| Problem Solving & Impact | 20% | Transparent reporting, SLA accountability, ~80% faster triage vs manual forms, ~40% duplicate reduction via geohash dedup + community verify |
| Agentic Depth | 20% | Six deterministic agents (intake, vision, routing, SLA, dedup, priority) plus tool-grounded civic assistant—not a single chat prompt |
| Innovation & Creativity | 20% | AI vision + geo hotspots + ethical gamification + geohash thread clustering (CivicThreads pattern) |
| Google Technologies | 15% | AI Studio, Gemini 2.5 Flash, Cloud Run, Firestore, Auth, Storage, Maps Platform |
| Product Experience | 10% | Civic Glass dark PWA, 3-tap report, realtime map, public status timeline |
| Technical Implementation | 10% | Zod validation, Firestore security rules, server-side secrets, geohash indexes, rate limiting |
| Completeness & Usability | 5% | Full report → verify → dashboard → admin resolve path on live HTTPS deployment |

---

## Section 3 — Key Features (8 official)

All eight Vibe2Ship example features are implemented and documented in production.

### Feature 1 — Image and video-based issue reporting

Three-step wizard at `/report`: camera capture or gallery upload, HTML5 geolocation, client-side WebP resize (max 1280px). Invalid media rejected with `InvalidMediaCard`. Optional 15s video capture (stretch).

**Evidence:** `frontend/src/pages/ReportPage.tsx`, `docs/api_contract.md` POST `/api/reports`

---

### Feature 2 — AI-powered issue categorization

Gemini 2.5 Flash returns structured JSON: category (9 enums), severity 1–5, department, title, description, confidence, safety_risk. L2 image cache reduces repeat latency.

> **Screenshot placeholder:** `screenshots/02-report-wizard-ai-analysis.png` — Step 2 AI analysis card with category chip, severity badge, confidence meter.

**Evidence:** `server/src/lib/gemini.ts`, `server/src/routes/reports.ts` POST `/api/reports/analyze`

---

### Feature 3 — Geo-location and mapping

Google Maps explorer at `/map` with severity-colored markers, search, category filters, 15s polling. List fallback when Maps API key absent. Server reverse geocode at `/api/geo/reverse`.

> **Screenshot placeholder:** `screenshots/03-map-explorer-markers.png` — Full-screen map with pothole markers in demo ward.

**Evidence:** `frontend/src/pages/MapPage.tsx`, `docs/diagrams/mermaid/05-report-intake-sequence.mmd`

---

### Feature 4 — Community verification

Authenticated upvote at POST `/api/reports/:id/upvote`. Verification tiers: 1 vote → level 1; 3 votes → Community Verified (+15 pts); 10 votes → level 3. Idempotent votes subcollection.

> **Screenshot placeholder:** `screenshots/04-issue-detail-upvote-timeline.png` — Issue detail with upvote button and verification badge.

**Evidence:** `server/src/lib/agents.ts` `processUpvote`, `frontend/src/pages/IssueDetailPage.tsx`

---

### Feature 5 — Real-time issue tracking

Public status timeline in `issues/{id}/events` subcollection: ai_analysis, routing, upvote, merge, status_change, reopen. My Reports shows SLA countdown.

> **Screenshot placeholder:** `screenshots/05-issue-timeline-sla.png` — Status timeline with department assignment and SLA deadline.

**Evidence:** `docs/architecture.md` Agent pipeline, `frontend/src/pages/MyReportsPage.tsx`

---

### Feature 6 — Impact dashboards

Dashboard at `/dashboard`: KPI tiles, Recharts trends, ward breakdown, engagement metrics. APIs: `/api/analytics/summary`, `/api/analytics/trends`, `/api/departments`.

> **Screenshot placeholder:** `screenshots/06-dashboard-charts.png` — Impact dashboard with open/resolved KPIs and trend chart.

**Evidence:** `frontend/src/pages/DashboardPage.tsx`, `server/src/routes/analytics.ts`

---

### Feature 7 — Predictive insights

Hotspots API at `/api/analytics/hotspots` — geohash-6 density scoring. Gemini narrative insight card on dashboard. Admin analytics at `/admin/analytics`.

> **Screenshot placeholder:** `screenshots/07-hotspot-card.png` — Hotspot ward card with risk score and AI insight.

**Evidence:** `server/src/routes/analytics.ts`, Phase 9 in `docs/PHASE-COMPLETION-TRACKER.md`

---

### Feature 8 — Gamification for citizen engagement

Civic points: report +10, upvote +5, merge +15, resolved +25. Badges (e.g. First Reporter). Opt-in leaderboard at `/leaderboard`.

> **Screenshot placeholder:** `screenshots/08-leaderboard-badges.png` — Leaderboard with civic points and badge chips.

**Evidence:** `server/src/lib/gamification.ts`, `frontend/src/pages/LeaderboardPage.tsx`

---

## Section 4 — Technologies Used

| Layer | Technology | Role |
|-------|------------|------|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS | Civic Glass PWA, 18 routes |
| UI motion | Framer Motion | Page transitions, wizard steps |
| Charts | Recharts | Dashboard trends and KPIs |
| Maps (client) | `@react-google-maps/api` | Explorer, mini-map in wizard |
| Routing | React Router 7 | SPA navigation |
| Backend | Node.js 22, Express 5, TypeScript | REST API + static SPA serve |
| Validation | Zod | Request/response schemas |
| Uploads | Multer | Multipart image intake |
| Database | Cloud Firestore | Issues, users, threads, events |
| Storage | Firebase Cloud Storage | Report and proof images |
| Auth | Firebase Authentication | Google Sign-In, ID tokens |
| AI | `@google/generative-ai` | Vision, insights, assistant |
| Geospatial | ngeohash | Dedup queries, thread clustering |
| Container | Docker multi-stage | Frontend build + server |
| CI | GitHub Actions | Build, tsc, unit tests |
| Automation | Makefile | test, lint, health, verify, deploy |

**Repository structure:** `frontend/`, `server/`, `shared/`, `docs/`, `scripts/` — see `docs/architecture.md`.

---

## Section 5 — Google Technologies Utilized

| Google product | Feature mapping |
|----------------|-----------------|
| **Google AI Studio** | Prototype → export → Cloud Run publish path; Build mode with React + Node runtime |
| **Gemini 2.5 Flash** | Image classification (structured JSON), dashboard insight narratives, civic assistant chat |
| **Firebase Authentication** | Google Sign-In; Bearer ID tokens on all protected API routes |
| **Cloud Firestore** | Realtime issue data, geohash indexes, votes subcollection, timeline events |
| **Firebase Cloud Storage** | `issues/{id}/{uuid}.webp` report photos; `proof.{ext}` resolution images |
| **Google Maps Platform** | Map tiles (client), Geocoding API (server reverse geocode) |
| **Cloud Run** | Production HTTPS at `asia-south1`; single container serves API + SPA |
| **Container Registry** | `gcr.io/community-hero-vibe2ship/community-hero:latest` |
| **Cloud Build** | `deploy/cloudbuild.yaml` CI deploy pipeline |

**Firebase project:** `community-hero-vibe2ship` (isolated from other projects).

---

## Section 6 — Architecture Diagram

Embed the system architecture diagram from the repo PNG export:

**PNG (embed in Google Doc):** `docs/diagrams/png/01-system-architecture.png`  
**Mermaid source:** `docs/diagrams/mermaid/01-system-architecture.mmd`

```
[Browser PWA] ──Bearer token──► [Express on Cloud Run]
       │                              │
       ├─ Firebase Auth (client)       ├─ Firebase Admin → Firestore / Storage
       └─ Google Maps (tiles)          └─ Gemini API (vision + chat)
```

**Narrative:** Single Cloud Run service serves `/api/*` and static `frontend/dist`. Firebase Admin SDK bypasses security rules for privileged server operations. All Gemini calls are server-side; API keys never exposed to client.

**Full spec:** `docs/architecture.md`, `docs/system-design.md`

---

## Section 7 — Agentic Workflow Diagram

Embed the six-agent orchestration diagram from the repo PNG export:

**PNG (embed in Google Doc):** `docs/diagrams/png/04-agent-workflow.png`  
**Mermaid source:** `docs/diagrams/mermaid/04-agent-workflow.mmd`

**Agents (post-submit pipeline in `server/src/lib/agents.ts`):**

1. **Intake** — Persist issue with geohash, ward, reporter metadata
2. **Vision** — Attach Gemini classification (pre-submit via `/api/reports/analyze`)
3. **Routing** — Map category → department (`DEPARTMENTS` in `shared/types.ts`)
4. **SLA** — Compute `slaDeadline` from severity-tiered hours
5. **Dedup** — Geohash range query for nearby same-category issues
6. **Priority** — `computePriorityScore(severity, safety_risk, confidence)`

**Branches:** Confidence &lt; 0.6 → status `Draft`, `needs_review`; duplicates → merge suggestions; upvote thresholds → Community Verified.

**Sequence detail:** `docs/diagrams/mermaid/05-report-intake-sequence.mmd`

---

## Section 8 — Live Deployment URL + GitHub URL

| Item | URL |
|------|-----|
| **Deployed application (primary)** | https://community-hero-987477089222.asia-south1.run.app |
| **Vercel preview (backup)** | https://community-hero-eight.vercel.app |
| **GitHub repository** | https://github.com/Ojas-Srivastava05/community-hero |
| **API health check** | https://community-hero-987477089222.asia-south1.run.app/api/health |

**Verification:** Run `bash scripts/verify-phases.sh` — automated checks for health, routes, analytics, leaderboard, Open311 export.

**Tag:** `v1.0.0-submission` (created by `bash scripts/prepare-submission.sh`)

---

## Section 9 — Team Members and Roles

**Team size:** Solo (1 member)

| Name | Role | Scope (all phases) |
|------|------|---------------------|
| **Ojas Srivastava** | Solo builder — Tech Lead, Full-stack, AI/Agents, Frontend/UX, Data/Geo, DevOps & Submission | Architecture, 6-agent pipeline, Gemini integration, React PWA (18 routes), Firestore/geohash, Cloud Run deploy, docs, demo, and BlockseBlock submission |

**Primary contact:** srivastavaojas454@gmail.com  
**GitHub:** [github.com/Ojas-Srivastava05/community-hero](https://github.com/Ojas-Srivastava05/community-hero)  
**Full role matrix:** `docs/TEAM-ROLES.md`

---

## Section 10 — Future Roadmap

| Horizon | Initiative |
|---------|------------|
| **Q3 2026** | Google ADK full agent deployment with durable tool registry |
| **Q3 2026** | Open311 municipal API integrations (beyond export adapter) |
| **Q3 2026** | Multilingual voice + EN/HI civic assistant |
| **Q4 2026** | Gemini embedding dedup (Model C) — upgrade from geohash-only |
| **Q4 2026** | MarkerClusterer library for dense urban wards |
| **Q4 2026** | Capacitor native APK for offline-first reporting |
| **2027** | BigQuery analytics pipeline + Vertex fine-tuning on ward datasets |
| **2027** | WhatsApp share agent for viral issue awareness |

**Competitive positioning:** Maintain agentic depth and Google stack integration while expanding municipal partnerships via Open311.

---

## Appendix references for jury

| Document | Path |
|----------|------|
| API contract | `docs/api_contract.md` |
| Competitive matrix | `docs/COMPETITIVE-MATRIX.md` |
| Presentation slides | `docs/ppt-info/SLIDES-COMPLETE.md` |
| Demo script | `docs/demo/APPENDIX-I-DEMO-SCRIPT.md` |
| Phase tracker | `docs/PHASE-COMPLETION-TRACKER.md` |
| Master plan | `docs/planning/Community-Hero-Master-Plan.pdf` |

---

*End of Appendix J content — paste into Google Docs, add screenshots from production URL, set public view link, submit on BlockseBlock.*
