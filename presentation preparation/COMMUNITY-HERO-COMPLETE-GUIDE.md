# Community Hero (CIVICPULSE AI)
## Complete Project Guide for Presentation Preparation

**Version:** 1.0  
**Date:** July 10, 2026  
**Audience:** Complete beginner — you know how to prompt AI, but not necessarily how to code  
**Author context:** Solo project by Ojas Srivastava for **Vibe to Ship (Vibe2Ship)** / BlockseBlock 2026

---

# Table of Contents

1. [Start Here: Read This First](#1-start-here-read-this-first)
2. [What Is This Project? (The 60-Second Version)](#2-what-is-this-project-the-60-second-version)
3. [Web Apps 101 — Concepts You Must Know](#3-web-apps-101--concepts-you-must-know)
4. [The Problem Community Hero Solves](#4-the-problem-community-hero-solves)
5. [Technology Stack — Every Tool Explained](#5-technology-stack--every-tool-explained)
6. [How the Whole System Fits Together](#6-how-the-whole-system-fits-together)
7. [Repository Structure — Every Folder Explained](#7-repository-structure--every-folder-explained)
8. [The Citizen Journey (End-to-End Flow)](#8-the-citizen-journey-end-to-end-flow)
9. [All Features — Official 8 + Bonus Features](#9-all-features--official-8--bonus-features)
10. [Frontend — Every Page and Route](#10-frontend--every-page-and-route)
11. [Backend — API and Server Logic](#11-backend--api-and-server-logic)
12. [The 6 AI Agents Pipeline](#12-the-6-ai-agents-pipeline)
13. [Database — What Gets Stored Where](#13-database--what-gets-stored-where)
14. [Authentication and Security](#14-authentication-and-security)
15. [Design and User Experience](#15-design-and-user-experience)
16. [Gamification — Points, Badges, Leaderboard](#16-gamification--points-badges-leaderboard)
17. [Analytics, Dashboards, and Predictive Insights](#17-analytics-dashboards-and-predictive-insights)
18. [Deployment — How the Live App Runs](#18-deployment--how-the-live-app-runs)
19. [Local Development — Running on Your Computer](#19-local-development--running-on-your-computer)
20. [Testing, CI/CD, and Quality](#20-testing-cicd-and-quality)
21. [Presentation Script and Demo Flow](#21-presentation-script-and-demo-flow)
22. [Competitive Positioning](#22-competitive-positioning)
23. [Hackathon Evaluation Criteria Mapping](#23-hackathon-evaluation-criteria-mapping)
24. [Glossary — Every Technical Term](#24-glossary--every-technical-term)
25. [Quick Reference Cheat Sheet](#25-quick-reference-cheat-sheet)
26. [Appendix: Live URLs and Key Files](#26-appendix-live-urls-and-key-files)

---

# 1. Start Here: Read This First

## Who is this document for?

You said you only know how to **prompt** (talk to AI tools like ChatGPT or Cursor). That is actually a useful starting point. This document assumes:

- You do **not** need to know how to write code to understand the project.
- You **do** need to understand what the app does, how it is built, and how to talk about it in a presentation.
- When you prompt an AI to change something in this project, knowing the structure below helps you ask better questions.

## What is in this folder?

| File | Purpose |
|------|---------|
| `COMMUNITY-HERO-COMPLETE-GUIDE.md` | This full guide (source document) |
| `COMMUNITY-HERO-COMPLETE-GUIDE.pdf` | Same content as a PDF for printing or sharing |

## What is this codebase?

This folder on your computer (`Vibe2Ship`) is the **entire source code** for a real, deployed web application called **Community Hero** (internal codename: **CIVICPULSE AI**).

It is a **civic issue reporting app** for Indian cities. Citizens photograph problems like potholes, water leaks, broken streetlights, or garbage piles. AI classifies the problem in seconds. Neighbors verify it. Municipal departments get routed tickets. Everyone can track resolution on a public timeline.

**Live app:** https://community-hero-987477089222.asia-south1.run.app

---

# 2. What Is This Project? (The 60-Second Version)

## One-liner

**Photo → AI → Map → Verify → Resolve.**

## The pitch (speak this in ~30 seconds)

> Community Hero lets any resident fix their neighborhood in four taps.
>
> Snap a photo of a pothole, leak, or broken streetlight — Gemini AI classifies it in under three seconds and routes it to the right department.
>
> Neighbors upvote to verify; the issue appears on a live map; six AI agents assign SLA deadlines and prevent duplicates.
>
> Admins resolve with proof photos; everyone sees a public timeline — transparent accountability.
>
> Built on Google AI Studio, Cloud Run, Firestore, and Maps — deployed and demo-ready today.

## What hackathon is this for?

- **Event:** Vibe to Ship (Vibe2Ship) / BlockseBlock 2026
- **Problem Statement:** #2 — Community Hero (hyperlocal civic reporting)
- **Deadline reference:** June 29, 2026
- **Team:** Solo project — Ojas Srivastava (full-stack, AI, frontend, deployment, docs)

## What makes it special?

| Ordinary civic apps | Community Hero |
|---------------------|----------------|
| Long forms to fill | Photo + AI auto-fills everything |
| Manual department routing | 6 AI agents route automatically |
| Duplicate reports everywhere | Geohash dedup + merge suggestions |
| Opaque status updates | Public named timeline on every issue |
| No engagement | Gamification: points, badges, leaderboard |

---

# 3. Web Apps 101 — Concepts You Must Know

Before diving into folders and files, understand these building blocks.

## 3.1 Frontend vs Backend

Think of a restaurant:

| Part | Web equivalent | What it does |
|------|----------------|--------------|
| **Dining room** (what customers see) | **Frontend** | Buttons, maps, photos, pages you tap and click |
| **Kitchen** (where food is prepared) | **Backend** | Logic, AI calls, database writes, security checks |
| **Pantry / storage** | **Database** | Stores all issues, users, votes permanently |

In this project:
- **Frontend** = `frontend/` folder — built with React (a JavaScript UI library)
- **Backend** = `server/` folder — built with Express (a Node.js web server)
- **Database** = Google Cloud Firestore (a NoSQL cloud database)

## 3.2 What is an API?

**API** = Application Programming Interface.

When you tap "Submit Report" on your phone, the frontend does **not** talk to the database directly. It sends an HTTP request to the backend, like:

```
POST /api/reports
(with photo, location, title, etc.)
```

The backend validates, runs AI agents, saves to Firestore, and returns JSON:

```json
{ "id": "abc-123", "issue": { "status": "Submitted", ... } }
```

The frontend then shows "Report submitted!" and navigates to the issue page.

## 3.3 What is a Route?

A **route** is a URL path that shows a page or triggers an API action.

**Frontend routes (pages users visit):**
- `/` → Landing page
- `/report` → Report wizard
- `/map` → Map of all issues

**Backend routes (API endpoints):**
- `GET /api/reports` → List issues
- `POST /api/reports/analyze` → AI analyzes a photo

## 3.4 What is Firebase?

**Firebase** is Google's platform for apps. This project uses:

| Firebase service | Purpose |
|------------------|---------|
| **Firebase Auth** | Google Sign-In — who is logged in |
| **Cloud Firestore** | Database — issues, users, votes |
| **Cloud Storage** | File storage — report photos, proof images |

## 3.5 What is Gemini?

**Gemini** is Google's AI model (like ChatGPT, but from Google). This project uses it to:

1. **Look at a photo** and say "this is a pothole, severity 4, safety risk"
2. **Chat** as a civic assistant ("show me open issues near me")
3. **Write trend summaries** for dashboards

## 3.6 What is Cloud Run?

**Cloud Run** is Google Cloud's service that runs your app in a container (a packaged box with everything needed). One URL serves both the website and the API.

Production URL: `https://community-hero-987477089222.asia-south1.run.app`

## 3.7 What is a PWA?

**PWA** = Progressive Web App. The app works in a mobile browser but can feel like a native app (installable, offline drafts, service worker). Mobile-first design for citizens reporting on the street.

## 3.8 What is TypeScript?

**TypeScript** = JavaScript with type checking. Both frontend and backend use `.ts` and `.tsx` files. Safer, fewer bugs, better for large projects.

---

# 4. The Problem Community Hero Solves

## Real-world pain

Indian cities have millions of civic complaints. Citizens use:

- WhatsApp groups (chaotic, no tracking)
- Government portals (slow forms, no AI)
- Apps like Swachhata (good participation, but weak AI and no predictive insights)

## Community Hero's solution

```
Citizen sees pothole
    ↓
Takes photo + GPS auto-captured
    ↓
Gemini AI classifies in ~3 seconds
    ↓
Issue appears on live map
    ↓
Neighbors upvote (1 / 3 / 10 verification tiers)
    ↓
AI agents route to department + set SLA deadline
    ↓
Admin resolves with proof photo
    ↓
Public timeline shows full history
```

## Measurable impact claims (for presentation)

| Metric | Target |
|--------|--------|
| AI triage speed | Under 3 seconds |
| Duplicate reduction | ~40% fewer duplicate pins |
| Full submit latency | Under 5 seconds on 4G |
| Classification accuracy | >90% on demo ward set |

---

# 5. Technology Stack — Every Tool Explained

## 5.1 Frontend stack

| Technology | Version | What it does (plain English) |
|------------|---------|------------------------------|
| **React** | 19 | Builds interactive UI components (buttons, maps, forms) |
| **Vite** | 8 | Fast development server and build tool |
| **TypeScript** | 6 | Typed JavaScript |
| **Tailwind CSS** | 4 | Utility CSS for styling (colors, spacing) |
| **React Router** | 7 | Page navigation (`/map`, `/report`, etc.) |
| **Firebase SDK** | 12 | Client-side auth and can connect to Firestore |
| **Google Maps API** | — | Interactive map with markers |
| **Framer Motion** | 12 | Smooth animations |
| **Recharts** | 3 | Charts on dashboard |
| **Zustand** | 5 | Lightweight state management |
| **Lucide React** | — | Icon library |

## 5.2 Backend stack

| Technology | What it does |
|------------|--------------|
| **Node.js** | JavaScript runtime on the server |
| **Express** | 5 | HTTP server framework — handles API routes |
| **Firebase Admin SDK** | Server-side database and auth verification |
| **@google/generative-ai** | Calls Gemini API |
| **Multer** | Handles file uploads (photos) |
| **Zod** | Validates request data (catches bad input) |
| **ngeohash** | Converts lat/lng to geohash strings for location queries |

## 5.3 Google Cloud / Firebase services

| Service | Role in this app |
|---------|------------------|
| **Firebase Auth** | Google Sign-In |
| **Cloud Firestore** | Primary database |
| **Cloud Storage** | Image storage |
| **Gemini API** | Vision + chat AI |
| **Google Maps Platform** | Map tiles + geocoding |
| **Cloud Run** | Production hosting |
| **Cloud Build** | CI/CD Docker builds |

## 5.4 DevOps and tooling

| Tool | Purpose |
|------|---------|
| **Docker** | Packages app for Cloud Run |
| **GitHub Actions** | Automated test + deploy on push |
| **Makefile** | Short commands: `make build`, `make deploy` |
| **Playwright** | Screenshot automation |
| **Mermaid** | Architecture diagrams in `docs/diagrams/` |

---

# 6. How the Whole System Fits Together

## Architecture diagram (text version)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S PHONE / BROWSER                    │
│  React PWA (frontend/dist)                                   │
│  - Pages: /report, /map, /dashboard, /admin                  │
│  - Firebase Auth (Google Sign-In)                            │
│  - Google Maps JS API                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           │ Bearer token (Firebase ID)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUD RUN — community-hero                      │
│              Express server on port 8080                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/reports│  │ /api/analytics│  │ /api/ai (chat)   │   │
│  │ Agent pipe  │  │ Hotspots      │  │ Tool calling     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  Also serves static SPA files (same origin)                  │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐    ┌──────────────────┐
│ Firebase         │    │ External APIs     │
│ - Firestore      │    │ - Gemini Vision   │
│ - Storage        │    │ - Maps Geocoding  │
│ - Auth verify    │    │                   │
└──────────────────┘    └──────────────────┘
```

## Key design decision: Single container

Production ships **one Docker image** that contains:
1. Built frontend (`frontend/dist/`)
2. Express API (`server/`)

**Why?** Same origin = no CORS issues, simpler auth, one URL for judges.

## Data flow for a new report

1. User selects photo on `/report` (Step 1)
2. Frontend compresses image to WebP
3. `POST /api/reports/analyze` → Gemini returns JSON analysis (Step 2)
4. User confirms/edits title, category, pin on map (Step 3)
5. `POST /api/reports` → upload image + run 6 agents + save Firestore
6. Map page updates in near-real-time
7. Gamification awards +10 civic points

---

# 7. Repository Structure — Every Folder Explained

```
Vibe2Ship/                          ← Root of entire project
├── frontend/                       ← Everything the user SEES
│   ├── src/
│   │   ├── pages/                  ← One file per screen (Landing, Map, Report, etc.)
│   │   ├── components/             ← Reusable UI pieces
│   │   │   ├── civic/              ← Civic-specific: maps, badges, glass cards
│   │   │   └── layout/             ← App shell, bottom navigation
│   │   ├── lib/                    ← Helpers: API client, auth, geo, i18n
│   │   └── stores/                 ← Zustand state (map, auth)
│   ├── public/                     ← Static files: manifest, service worker, geojson
│   └── package.json                ← Frontend dependencies
│
├── server/                         ← Everything the server DOES
│   ├── src/
│   │   ├── index.ts                ← Server entry point, mounts all routes
│   │   ├── routes/                 ← API endpoints by domain
│   │   ├── lib/                    ← Core logic: agents, gemini, geo, open311
│   │   │   └── agents/             ← Individual agent modules
│   │   └── middleware/             ← Auth check, rate limiting
│   ├── scripts/                    ← Seed data, admin tools
│   └── tests/                      ← Automated tests
│
├── shared/                         ← Types shared between frontend and server
│   └── types.ts                    ← Categories, statuses, departments
│
├── docs/                           ← 45+ markdown documentation files
│   ├── architecture.md             ← Technical architecture
│   ├── api_contract.md             ← Every API endpoint documented
│   ├── diagrams/                   ← 16 Mermaid architecture diagrams
│   ├── ppt-info/                   ← Presentation slide content
│   └── submission/                 ← Hackathon submission materials
│
├── scripts/                        ← Deploy, verify, screenshots, diagrams
├── .github/workflows/              ← CI (test) and CD (deploy)
├── deploy/Dockerfile               ← How Cloud Run image is built
├── firebase.json                   ← Firebase config
├── firestore.rules                 ← Database security rules
├── firestore.indexes.json          ← Database query indexes
├── storage.rules                   ← Image storage security
├── Makefile                        ← Shortcut commands
├── package.json                    ← Root scripts (run both frontend + server)
└── README.md                       ← Project overview
```

## File counts (approximate)

| Area | Files |
|------|-------|
| Frontend source | ~78 files |
| Server source | ~54 files |
| Documentation | ~45 markdown files |
| Architecture diagrams | 16 Mermaid + 16 PNG |

---

# 8. The Citizen Journey (End-to-End Flow)

## Step-by-step user story

### Step 1: Discover
- User visits landing page `/`
- Sees live stats, hero message, "Report an Issue" CTA
- Can browse map without logging in (guest read access)

### Step 2: Sign in
- Google Sign-In via Firebase Auth at `/login`
- Also supports demo/guest modes for testing
- Auth token attached to all API calls

### Step 3: Report (3-step wizard at `/report`)

**Step 3a — Capture media**
- Take photo, upload video, or use voice note
- GPS location captured automatically
- Image compressed client-side

**Step 3b — AI analysis**
- Spinner: "Analyzing with Gemini..."
- Returns: category, severity (1-5), title, description, department, confidence
- If confidence < 0.6 → flagged for review (Draft status)
- If invalid image → `InvalidMediaCard` with retake guidance

**Step 3c — Confirm and submit**
- User can edit AI suggestions
- Adjust pin on map if GPS is wrong
- Duplicate suggestions shown — option to merge into existing issue
- Submit triggers full agent pipeline

### Step 4: Community verification
- Other users see issue on `/map`
- Tap upvote on `/issues/:id`
- Verification tiers:
  - **1 vote** → Level 1 verification
  - **3 votes** → Level 2, status becomes "Community Verified", reporter gets +15 points
  - **10 votes** → Level 3 (maximum community trust)

### Step 5: Tracking
- Reporter sees SLA countdown on `/my-reports`
- Public timeline on issue detail page shows every event:
  - AI analysis, routing, upvotes, status changes, notifications

### Step 6: Resolution
- Admin at `/admin` updates status: Assigned → In Progress → Resolved
- Uploads proof photo
- Timeline updates for everyone

### Step 7: Engagement
- Earn civic points and badges on `/profile`
- Compete on `/leaderboard` (opt-in)
- Ask civic assistant at `/assistant`

---

# 9. All Features — Official 8 + Bonus Features

## Official Vibe2Ship features (required)

| # | Feature | Route / API | How it works |
|---|---------|-------------|--------------|
| 1 | **Image & video reporting** | `/report` | 3-step wizard, WebP resize, video keyframes |
| 2 | **AI issue categorization** | `POST /api/reports/analyze` | Gemini Vision → 9 categories, severity 1-5 |
| 3 | **Geo-location & mapping** | `/map` | Google Maps + marker clustering, list fallback |
| 4 | **Community verification** | `POST /api/reports/:id/upvote` | Tiers at 1 / 3 / 10 votes |
| 5 | **Real-time issue tracking** | `/issues/:id`, `/my-reports` | Timeline, SLA deadlines, status updates |
| 6 | **Impact dashboards** | `/dashboard`, `/api/analytics/*` | KPIs, charts, ward stats |
| 7 | **Predictive insights** | `/api/analytics/hotspots` | Geohash density scoring + AI insight card |
| 8 | **Gamification** | `/leaderboard` | Civic points, badges, rules page |

## Bonus features (beyond requirements)

| Feature | Location | Description |
|---------|----------|-------------|
| **6-agent pipeline** | `server/src/lib/agents/` | Intake, Vision, Routing, SLA, Dedup, Priority |
| **Admin panel** | `/admin` | Status updates, proof upload, queue management |
| **Admin analytics** | `/admin/analytics` | Ward exports, SLA breach monitoring |
| **Civic AI assistant** | `/assistant` | Gemini chat with Firestore tool calling |
| **Activity threads** | `/activity`, `/threads/:id` | Geohash-clustered issue forums |
| **Open311 export** | `/api/analytics/export/open311` | Municipal interoperability standard |
| **Embed map widget** | `/embed/map` | iframe for RWAs and news sites |
| **Scorecards** | `/scorecards` | Department performance metrics |
| **Notifications** | `/notifications` | In-app notification center |
| **Offline drafts** | Report wizard | Queue reports when offline |
| **i18n** | Throughout | Internationalization support |
| **Comments** | Issue pages | Community discussion on issues |
| **PWA** | `public/sw.js`, manifest | Installable mobile experience |

---

# 10. Frontend — Every Page and Route

The main routing file is `frontend/src/App.tsx`. There are **22+ routes**.

| Route | Page | Who uses it | Key actions |
|-------|------|-------------|-------------|
| `/` | Landing | Everyone | View stats, sign in, navigate |
| `/login` | Login | New users | Google Sign-In |
| `/report` | Report Wizard | Citizens | Photo → AI → Submit |
| `/map` | Map Explorer | Everyone | Browse issues on map |
| `/issues/:id` | Issue Detail | Everyone | View timeline, upvote, share, merge |
| `/my-reports` | My Reports | Logged-in users | Track own submissions + SLA |
| `/dashboard` | Dashboard | Everyone | KPIs, charts, hotspots, AI insight |
| `/leaderboard` | Leaderboard | Everyone | Top reporters by civic points |
| `/assistant` | Civic Assistant | Logged-in users | AI chat about local issues |
| `/activity` | Activity Feed | Everyone | Geohash thread list |
| `/threads/:id` | Thread Detail | Everyone | Clustered issues in one area |
| `/profile` | Profile | Logged-in users | Points, badges, preferences |
| `/notifications` | Notifications | Logged-in users | Status change alerts |
| `/admin` | Admin Panel | Admins only | Update status, upload proof |
| `/admin/analytics` | Admin Analytics | Admins only | Ward data, SLA breaches |
| `/scorecards` | Scorecards | Everyone | Department performance |
| `/gamification-rules` | Rules | Everyone | How points work |
| `/embed` or `/embed/map` | Embed Widget | External sites | Minimal map for iframe |
| `/terms` | Terms of Service | Everyone | Legal |
| `/privacy` | Privacy Policy | Everyone | Legal |
| `/waiting` | Waiting Room | Everyone | Shown on rate limit (429) |
| `*` | Not Found | Everyone | 404 page |

## Important frontend modules (`frontend/src/lib/`)

| File | Purpose |
|------|---------|
| `auth.tsx` | Firebase Google Sign-In, session state |
| `api.ts` | All HTTP calls to backend with auth token |
| `firebase.ts` | Firebase client initialization |
| `geo.ts` | Location helpers |
| `i18n.tsx` | Translations and locale |
| `admin-mode.tsx` | Admin route protection |
| `image-media.ts` | Photo compression and validation |
| `video-media.ts` | Video keyframe extraction |
| `offline-queue.ts` | Offline report submission |
| `complaint-draft.ts` | Save draft while reporting |

## Key UI components (`frontend/src/components/civic/`)

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Frosted glass UI panels |
| `CivicMap` | Google Maps with issue markers |
| `SeverityBadge` | Color-coded severity 1-5 |
| `AgentPipelineStepper` | Shows agent progress during submit |
| `InvalidMediaCard` | Error when photo isn't a civic issue |
| `PlacesAutocomplete` | Address search on map |
| `PointsToast` | "+10 points!" popup animation |

## Bottom navigation

Mobile app has persistent bottom nav (`BottomNav.tsx`):
- Home / Map / **Report FAB** / Activity / Profile

---

# 11. Backend — API and Server Logic

Entry point: `server/src/index.ts`

## All API route groups

| Prefix | File | Purpose |
|--------|------|---------|
| `/api/health` | index.ts | Health check + Firestore probe |
| `/api/reports` | routes/reports.ts | CRUD, analyze, upvote, merge, admin status |
| `/api/reports` (comments) | routes/comments.ts | Issue comments |
| `/api/analytics` | routes/analytics.ts | Summary, trends, hotspots, Open311 export |
| `/api/ai` | routes/ai.ts | Civic assistant chat |
| `/api/geo` | routes/geo.ts | Reverse geocoding proxy |
| `/api/leaderboard` | routes/leaderboard.ts | Top reporters ranking |
| `/api/threads` | routes/threads.ts | Geohash issue clusters |
| `/api/users` | routes/users.ts | User profile upsert/read |
| `/api/departments` | routes/departments.ts | Department catalog |
| `/api/auth` | routes/auth.ts | Auth-related endpoints |
| `/api/notifications` | routes/notifications.ts | User notifications |

## Most important API endpoints

### Reports

| Method | Endpoint | Auth | What it does |
|--------|----------|------|--------------|
| POST | `/api/reports/analyze` | Yes | Gemini vision on uploaded image |
| POST | `/api/reports` | Yes | Create new issue (runs agent pipeline) |
| GET | `/api/reports` | No | List issues (public, filtered) |
| GET | `/api/reports/:id` | No | Single issue detail |
| POST | `/api/reports/:id/upvote` | Yes | Community verification vote |
| POST | `/api/reports/:id/merge` | Yes | Merge duplicate into existing |
| PATCH | `/api/reports/:id/status` | Admin | Update issue status |

### Analytics

| Method | Endpoint | What it returns |
|--------|----------|-----------------|
| GET | `/api/analytics/summary` | Total issues, resolved count, avg resolution time |
| GET | `/api/analytics/trends` | Category trends + optional AI narrative |
| GET | `/api/analytics/hotspots` | High-risk geohash cells |
| GET | `/api/analytics/export/open311` | Open311 GeoReport v2 JSON (admin) |

### AI

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/api/ai/chat` | Civic assistant with tool calling |

## Issue categories (9 types)

```
pothole, water_leak, streetlight, waste, road_damage,
drainage, signage, encroachment, other
```

## Issue statuses (lifecycle)

```
Draft → Submitted → Community Verified → Assigned → In Progress → Resolved → Closed
```

- **Draft:** Low AI confidence (<0.6), hidden from public map
- **Submitted:** New report, awaiting community verification
- **Community Verified:** 3+ upvotes
- **Assigned / In Progress / Resolved:** Admin workflow
- **Closed:** Final state

## Rate limits (security)

| Action | Limit |
|--------|-------|
| Create report | 10 per user per 24 hours |
| Upvote | 30 per user per hour |
| AI chat | 20 per user per minute |

Exceeded → HTTP 429 → user may see `/waiting` page with countdown.

## Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_MEDIA` | 400 | Bad image / not a civic issue |
| `NEEDS_REVIEW` | 202 | Low confidence, saved as Draft |
| `RATE_LIMIT` | 429 | Too many requests |
| `FORBIDDEN` | 403 | Not admin / can't upvote yet |
| `NOT_FOUND` | 404 | Issue doesn't exist |

---

# 12. The 6 AI Agents Pipeline

When a report is submitted, `runAgentPipeline()` in `server/src/lib/agents/` runs these agents in sequence.

## Agent overview

| # | Agent | File | Input | Output |
|---|-------|------|-------|--------|
| 1 | **Intake** | `agents/intake.ts` | Form data + images | Base Firestore document, geohash-7, wardId |
| 2 | **Vision** | `agents/vision.ts` | Image buffer | IssueAnalysis JSON (category, severity, confidence) |
| 3 | **Routing** | `agents/routing.ts` | Category | departmentId, Open311 service code |
| 4 | **SLA** | `agents/sla.ts` | Category + severity | slaDeadline ISO timestamp |
| 5 | **Dedup** | `agents/dedup.ts` | Location + category | duplicate_suggestions[] |
| 6 | **Priority** | `agents/routing.ts` | All above + upvotes | priorityScore 0-100 |

## Post-submit agents

| Agent | Trigger | Effect |
|-------|---------|--------|
| **Gamification** | After create | +10 points, "First Reporter" badge |
| **Verification** | On upvote | Updates verificationLevel 1/2/3 |
| **Notify** | Status change | Creates notification documents |
| **Communicator** | Optional | Citizen-facing status messages |

## Confidence gate

If Gemini `confidence < 0.6`:
- Status set to **Draft**
- `aiMetadata.needs_review = true`
- Hidden from public map queries

## Priority score formula

```
priority = (severity/5)*40 + min(upvotes/20,1)*20 + (safety_risk?30:0) + min(age_days/14,1)*10
```
Normalized to 0-100. Higher = more urgent.

## Duplicate detection

- Queries Firestore for issues with same geohash prefix (precision 6) + same category
- Returns suggestions with distance in meters
- User chooses to merge or create new (no auto-merge without consent)

## SLA hours by category (examples)

| Category | Severity 5 | Severity 3 | Severity 1 |
|----------|------------|------------|------------|
| Water leak | 24h | 72h | 120h |
| Pothole | 48h | 96h | 168h |
| Waste | 12h | 36h | 72h |

---

# 13. Database — What Gets Stored Where

Database: **Google Cloud Firestore** (NoSQL document database)

## Main collections

### `issues/{issueId}` — The core document

| Field | Type | Description |
|-------|------|-------------|
| title, description | string | What the problem is |
| category | enum | One of 9 categories |
| severity | number | 1 (low) to 5 (critical) |
| status | enum | Draft → Resolved lifecycle |
| lat, lng | number | GPS coordinates |
| geohash | string | Location index for queries |
| wardId | string | Municipal ward identifier |
| address | string | Human-readable location |
| reporterId | string | Firebase UID of reporter |
| departmentId | string | Routed department |
| upvoteCount | number | Community votes |
| verificationLevel | number | 0, 1, 2, or 3 |
| priorityScore | number | 0-100 urgency |
| slaDeadline | string | ISO date when SLA expires |
| imageUrls | string[] | Photo URLs in Cloud Storage |
| proofImageUrl | string | Admin resolution proof |
| aiMetadata | object | AI analysis, agent steps, dupes |
| isDemo | boolean | True for seeded demo data |
| createdAt, updatedAt | string | Timestamps |

### Subcollections under each issue

| Path | Purpose |
|------|---------|
| `issues/{id}/events/{eventId}` | Timeline events (upvote, status change, routing) |
| `issues/{id}/votes/{userId}` | One vote per user (prevents double voting) |

### `users/{uid}`

| Field | Description |
|-------|-------------|
| displayName, email, photoURL | Profile from Google |
| civicPoints | Total gamification points |
| badges | Array of earned badge IDs |
| wardId | User's primary ward |

### `threads/{threadId}`

Geohash-5 clustered issues: `issueIds[]`, title, summary, count.

### `departments/{id}`

Seeded municipal departments with SLA tables and Open311 codes.

### `notifications/{id}`

User notifications for status changes.

## Cloud Storage paths

```
issues/{issueId}/{uuid}.webp     ← Report photos
issues/{issueId}/proof.webp      ← Resolution proof photos
```

## Security rules summary

- **Public read** on non-draft issues (anyone can browse map)
- **Authenticated write** for creating reports and votes
- **Admin operations** go through server (Firebase Admin SDK), not client rules
- Rules defined in `firestore.rules` and `storage.rules`

---

# 14. Authentication and Security

## How login works

1. User clicks "Sign in with Google" on frontend
2. Firebase Auth popup → Google OAuth
3. Firebase returns **ID token** (JWT)
4. Frontend stores session, attaches `Authorization: Bearer <token>` to every API call
5. Server `requireAuth` middleware verifies token with Firebase Admin SDK

## Admin access

Admins identified by environment variables:
- `ADMIN_EMAILS` — comma-separated emails
- `ADMIN_UIDS` — comma-separated Firebase UIDs
- `ADMIN_SECRET` — header for batch analytics endpoints

## 7 security layers

1. **Firebase Auth** — identity verification
2. **Server-side token validation** — never trust client alone
3. **Firestore security rules** — database-level access control
4. **Rate limiting** — prevent abuse
5. **Zod validation** — reject malformed requests
6. **Secrets server-side only** — Gemini key never in browser
7. **Upvote eligibility** — account age >24h OR ≥1 prior report

## Guest access

- **Can:** Browse map, view issues, read leaderboard, view dashboard
- **Cannot:** Submit reports, upvote, or chat without signing in

---

# 15. Design and User Experience

## Design system: "Civic Glass"

| Element | Value |
|---------|-------|
| Background | Midnight `#0B0F14` |
| Cards | Frosted glass `rgba(255,255,255,0.06)` + blur |
| Primary accent | Civic Teal `#14B8A6` |
| Text | Cloud White `#F8FAFC` |
| Fonts | Space Grotesk, Fraunces, Plus Jakarta Sans |

## Severity colors

| Level | Color | Meaning |
|-------|-------|---------|
| 5 Critical | Red `#EF4444` | Immediate danger |
| 4 High | Orange `#F97316` | Urgent |
| 3 Medium | Yellow `#EAB308` | Moderate |
| 2 Low | Green `#22C55E` | Minor |
| 1 Minimal | Gray | Cosmetic |

## Mobile-first

- Designed for 390×844 phone screens
- Bottom navigation with floating Report button
- Touch-friendly tap targets
- PWA installable from browser

## Honest empty states

The app never shows fake data. If no issues exist, it says "Be the first reporter in this area" with a CTA to `/report`.

---

# 16. Gamification — Points, Badges, Leaderboard

## Points system

| Action | Points |
|--------|--------|
| Submit a report | +10 |
| Report reaches Community Verified (3 votes) | +15 to reporter |
| Upvote someone else's issue | +2 |

## Badges (examples)

- **First Reporter** — submitted first issue
- Additional badges for milestones (defined in gamification module)

## Leaderboard (`/leaderboard`)

- Ranks users by `civicPoints`
- Opt-in display (privacy-conscious)
- Weekly scoring periods supported

## Rules page (`/gamification-rules`)

Explains the system transparently to users and judges.

---

# 17. Analytics, Dashboards, and Predictive Insights

## Public dashboard (`/dashboard`)

Shows:
- Total issues reported
- Resolution rate
- Average resolution time
- Issues by category (pie/bar charts via Recharts)
- Hotspot map overlay
- AI-generated insight card (trend narrative)

## Hotspot scoring (Model D)

Rule-based risk score per geohash-5 cell:
- Issue density in cell
- Average severity
- Recency decay (14-day exponential)

No ML training required — works out of the box.

## Admin analytics (`/admin/analytics`)

- Ward-level exports
- SLA breach monitoring
- Department performance

## Open311 export

Standard format for municipal CRM integration. Maps internal categories to Open311 service codes (001=pothole, 010=water leak, etc.).

---

# 18. Deployment — How the Live App Runs

## Production topology

| Setting | Value |
|---------|-------|
| GCP Project | `community-hero-vibe2ship` |
| Region | `asia-south1` (Mumbai) |
| Service | `community-hero` |
| URL | https://community-hero-987477089222.asia-south1.run.app |
| Container | `gcr.io/community-hero-vibe2ship/community-hero:latest` |
| Resources | 1 CPU, 512Mi RAM |

## Build process

1. `deploy/Dockerfile` multi-stage build:
   - Stage 1: Build frontend with Vite (bakes `VITE_*` env vars)
   - Stage 2: Copy server + built `frontend/dist/`
2. `deploy/cloudbuild.yaml` triggers on GitHub push
3. Image pushed to Google Container Registry
4. Cloud Run deploys new revision

## Also deployed

| Environment | URL | Notes |
|-------------|-----|-------|
| Vercel preview | community-hero-eight.vercel.app | Optional frontend-only preview |
| Embed widget | `/embed/map` | For external websites |

## Embed snippet (for presentation)

```html
<iframe
  src="https://community-hero-987477089222.asia-south1.run.app/embed/map?lat=12.9716&lng=77.5946"
  width="390" height="560"
  style="border:0;border-radius:16px"
  title="Community Hero live map">
</iframe>
```

## Firebase setup requirements

1. Add Cloud Run hostname to **Firebase Auth → Authorized domains**
2. Deploy Firestore rules: `firebase deploy --only firestore:rules,firestore:indexes,storage`

---

# 19. Local Development — Running on Your Computer

## Prerequisites

- Node.js 18+ installed
- npm (comes with Node)
- Firebase project credentials in `.env` files
- Optional: `gcloud` CLI for seeding and deploy

## Quick start

```bash
# 1. Copy environment templates
cp .env.example frontend/.env
cp .env.example server/.env
# (Fill in API keys)

# 2. Install dependencies
make install

# 3. Terminal 1 — start backend
cd server && npm run dev    # http://localhost:3001

# 4. Terminal 2 — start frontend
cd frontend && npm run dev  # http://localhost:5173

# Or from root:
npm run dev   # runs both concurrently
```

## Seed demo data

```bash
make seed-all   # 25 demo issues + departments (needs gcloud auth)
```

## Useful Makefile commands

| Command | What it does |
|---------|--------------|
| `make install` | Install all npm packages |
| `make build` | Production build |
| `make test` | Run server tests |
| `make deploy` | Deploy to Cloud Run |
| `make verify` | Curl production health check |
| `make diagrams` | Render Mermaid diagrams to PNG |

---

# 20. Testing, CI/CD, and Quality

## Automated tests

Location: `server/tests/` and `server/src/lib/**/*.test.ts`

Test areas:
- Agent pipeline logic
- Geohash calculations
- Schema validation
- Security rules
- API integration (reports)
- Priority score formula

Run: `make test` or `cd server && npm test`

## GitHub Actions

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | Push/PR to main | Install, build frontend, typecheck server, run tests |
| `deploy.yml` | Push to main | Cloud Build + Cloud Run deploy |

## Phase verification

`scripts/verify-phases.sh` — curls all 19 phase checkpoints against production URL.

## Documentation quality

- 45+ markdown files in `docs/`
- 16 architecture diagrams (Mermaid source + PNG exports)
- Full API contract documented
- Submission checklist, demo script, slide content

---

# 21. Presentation Script and Demo Flow

## 3-minute judge demo (recommended order)

1. **Landing** (`/`) — Show live stats, explain problem in 10 seconds
2. **Report** (`/report`) — Take/upload pothole photo → show AI analysis in ~3s
3. **Confirm** — Show category, severity, map pin auto-set
4. **Map** (`/map`) — New pin appears, cluster with neighbors
5. **Issue detail** (`/issues/:id`) — Upvote, show timeline
6. **Dashboard** (`/dashboard`) — KPIs, hotspot card, AI insight
7. **Admin** (`/admin`) — Resolve with proof photo (if admin logged in)
8. **Assistant** (`/assistant`) — "What open issues are near Koramangala?"

## Key talking points for Q&A

**"Why not just use Swachhata?"**
> Swachhata proved citizens will participate, but lacks sub-3-second AI triage, 6-agent routing, predictive hotspots, and Open311 export.

**"How is AI used beyond a chatbot?"**
> Six deterministic agents: vision classify, department routing, SLA deadlines, duplicate detection, priority scoring, and verification tiers — not a single prompt.

**"What Google technologies?"**
> Gemini 2.5 Flash (vision + chat), Cloud Run, Firestore, Firebase Auth, Cloud Storage, Maps Platform, AI Studio deploy path.

**"Is it production-ready?"**
> Live on Cloud Run with CI/CD, health checks, rate limits, security rules, and 19-phase verification script.

## Slide content location

Full 15-slide deck with speaker notes: `docs/ppt-info/SLIDES-COMPLETE.md`

## Demo script

Step-by-step: `docs/demo/APPENDIX-I-DEMO-SCRIPT.md`

---

# 22. Competitive Positioning

| App | Strength | Community Hero advantage |
|-----|----------|--------------------------|
| **Swachhata-MoHUA** | 4041+ cities, photo+GPS+upvote | + AI triage, + agents, + hotspots |
| **FixMyStreet** | Open311, map pins | + AI vision, + gamification, + Google stack |
| **InfraGuard** | Fast Gemini vision | + community verification tiers, + full agent workflow |

## Three differentiators to emphasize

1. **Agentic AI** — 6 agents, not one chatbot
2. **Predictive hotspots** — prevent problems before they escalate
3. **Sub-3s vision triage** — InfraGuard speed + Swachhata participation

Full matrix: `docs/COMPETITIVE-MATRIX.md`

---

# 23. Hackathon Evaluation Criteria Mapping

| Criteria | Weight | How Community Hero scores |
|----------|--------|---------------------------|
| Problem Solving & Impact | **20%** | Transparent reporting, measurable triage speed, public accountability |
| Agentic Depth | **20%** | 6-agent pipeline with confidence gates and dedup branches |
| Innovation & Creativity | **20%** | AI vision + geo hotspots + ethical gamification + threads |
| Google Technologies | **15%** | Gemini, Cloud Run, Firestore, Auth, Storage, Maps |
| Product Experience | **10%** | Mobile PWA, 3-tap report, realtime map, clear timeline |
| Technical Implementation | **10%** | Structured JSON, security rules, server secrets, geohash indexes |
| Completeness & Usability | **5%** | Full report → verify → resolve path, live deployment |

**Memorize:** Impact 20%, Agentic 20%, Innovation 20%, Google Tech 15%.

---

# 24. Glossary — Every Technical Term

| Term | Simple definition |
|------|-------------------|
| **API** | Way for frontend to ask backend to do things |
| **Agent** | Automated workflow step that processes data |
| **Bearer token** | Secret string proving you're logged in |
| **CI/CD** | Automatic test + deploy when code is pushed |
| **Cloud Run** | Google service that runs your app in the cloud |
| **CORS** | Security rule about which websites can call your API |
| **CRUD** | Create, Read, Update, Delete — basic database operations |
| **Docker** | Packages app into a container for deployment |
| **Endpoint** | Specific API URL like `/api/reports` |
| **Env vars** | Secret configuration (API keys) stored outside code |
| **Express** | Node.js framework for building APIs |
| **Firestore** | Google's document database |
| **Frontend** | The visual part users interact with |
| **Geohash** | Short string encoding GPS location for fast queries |
| **Gemini** | Google's AI model family |
| **HTTP** | Protocol for web requests (GET, POST, etc.) |
| **iframe** | Embed another webpage inside your page |
| **JSON** | Text format for structured data `{"key": "value"}` |
| **JWT** | JSON Web Token — proves identity |
| **Latency** | How long an operation takes |
| **Middleware** | Code that runs before your route handler |
| **NoSQL** | Database without rigid tables (Firestore is NoSQL) |
| **OAuth** | "Sign in with Google" protocol |
| **Open311** | Standard format for civic issue reporting to governments |
| **PWA** | Web app that feels like a native mobile app |
| **React** | JavaScript library for building UIs |
| **REST** | Style of API using HTTP methods |
| **Route** | URL path mapping to a page or API handler |
| **SDK** | Software library provided by a platform (Firebase SDK) |
| **SLA** | Service Level Agreement — deadline for resolution |
| **SPA** | Single Page App — one HTML page, JS swaps content |
| **TypeScript** | JavaScript with types |
| **UUID** | Unique random ID for documents |
| **Vite** | Fast frontend build tool |
| **WebP** | Compressed image format |
| **Zod** | Library to validate data shapes |

---

# 25. Quick Reference Cheat Sheet

## Live URLs

| What | URL |
|------|-----|
| App | https://community-hero-987477089222.asia-south1.run.app |
| Health | https://community-hero-987477089222.asia-south1.run.app/api/health |
| Embed map | https://community-hero-987477089222.asia-south1.run.app/embed/map |
| GitHub | https://github.com/Ojas-Srivastava05/community-hero |

## Core loop

```
Photo → Gemini analyze → Submit → Agents → Firestore → Map → Upvote → Admin resolve
```

## 9 categories

pothole · water_leak · streetlight · waste · road_damage · drainage · signage · encroachment · other

## 6 agents

Intake → Vision → Routing → SLA → Dedup → Priority

## Verification tiers

1 vote → Level 1 · 3 votes → Community Verified · 10 votes → Level 3

## Key env vars (never commit real values)

| Variable | Where | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | server | AI vision + chat |
| `VITE_GOOGLE_MAPS_API_KEY` | frontend build | Map tiles |
| `VITE_FIREBASE_*` | frontend build | Auth config |
| `FIREBASE_PROJECT_ID` | server | Database project |
| `ADMIN_EMAILS` | server | Admin access |

## Prompting tips for this codebase

When asking AI (Cursor/ChatGPT) to change something, be specific:

- **Bad:** "Fix the map"
- **Good:** "In `frontend/src/pages/MapExplorer.tsx`, the marker cluster doesn't update after a new report. After submit in ReportWizard, the map should refetch issues."

Always mention:
1. Which folder (`frontend/` vs `server/`)
2. Which file or route
3. Expected behavior vs actual behavior

---

# 26. Appendix: Live URLs and Key Files

## Documentation index (in repo)

| Document | Path | Contents |
|----------|------|----------|
| README | `README.md` | Project overview |
| Architecture | `docs/architecture.md` | Full technical architecture |
| System design | `docs/system-design.md` | Caching, AI models, principles |
| API contract | `docs/api_contract.md` | Every endpoint |
| Deployment | `docs/deployment.md` | GCP setup runbook |
| Product vision | `docs/PRODUCT-VISION.md` | Pitch scripts |
| Phase tracker | `docs/PHASE-COMPLETION-TRACKER.md` | Phases 0-19 status |
| Submission checklist | `docs/SUBMISSION-CHECKLIST.md` | Hackathon deliverables |
| Demo script | `docs/demo/APPENDIX-I-DEMO-SCRIPT.md` | 3-minute demo |
| Slides | `docs/ppt-info/SLIDES-COMPLETE.md` | 15 slides + notes |
| Design | `.stitch/DESIGN.md` | Civic Glass design system |
| Diagrams | `docs/diagrams/` | 16 architecture diagrams |

## Phase development summary

The project was built in **20 phases (0-19)**:

| Phase range | Focus |
|-------------|-------|
| 0 | Foundation, requirements, quality bar |
| 1-2 | UI shell, report wizard, Gemini vision |
| 3-4 | Maps, geo, issue tracking |
| 5-7 | Verification, agents, notifications |
| 8-10 | Dashboards, insights, gamification |
| 11-14 | Admin, Open311, security, polish |
| 15-19 | Docs, submission, deployment, verification |

All phases marked 100% complete in `docs/PHASE-COMPLETION-TRACKER.md`.

---

## Final note

You do not need to memorize every file. For a presentation, focus on:

1. **The problem** — fragmented civic reporting
2. **The solution** — photo → AI → map → verify → resolve
3. **The tech** — Google stack (Gemini, Cloud Run, Firestore, Maps)
4. **The differentiation** — 6 agents, not a chatbot
5. **The proof** — live URL, working demo path

This document is your map. The codebase is the territory. Use AI prompting to explore specific files when you need deeper detail on any section.

---

*Community Hero (CIVICPULSE AI) — Vibe to Ship 2026 — MIT License*
