# Community Hero — Complete Builder’s Guide (Start From Zero)

**Who this is for:** You know the hackathon problem statement, but you don’t yet know what you actually built. This document explains **everything** in plain language — no assumed coding knowledge.

**Product names you’ll see:**
- **Community Hero** — the user-facing app name
- **CIVICPULSE AI** — internal codename (slides, docs, agent branding)
- **Vibe2Ship / BlockseBlock** — the hackathon (Problem Statement 2)

**Live app (production):** https://community-hero-987477089222.asia-south1.run.app

---

## Table of contents

1. [The problem you’re solving](#1-the-problem-youre-solving)
2. [Your solution in one sentence](#2-your-solution-in-one-sentence)
3. [How a citizen uses the app (story)](#3-how-a-citizen-uses-the-app-story)
4. [How an authority uses the app (story)](#4-how-an-authority-uses-the-app-story)
5. [The 8 official hackathon features](#5-the-8-official-hackathon-features)
6. [Bonus features you built beyond the 8](#6-bonus-features-you-built-beyond-the-8)
7. [What makes your project unique](#7-what-makes-your-project-unique)
8. [The six AI agents (explained simply)](#8-the-six-ai-agents-explained-simply)
9. [Every screen in the app](#9-every-screen-in-the-app)
10. [Issue lifecycle (statuses)](#10-issue-lifecycle-statuses)
11. [Issue categories and departments](#11-issue-categories-and-departments)
12. [Community verification and gamification](#12-community-verification-and-gamification)
13. [Tech stack — what each piece does](#13-tech-stack--what-each-piece-does)
14. [How the code is organized (folders)](#14-how-the-code-is-organized-folders)
15. [Where data lives (database)](#15-where-data-lives-database)
16. [URLs, login, and demo accounts](#16-urls-login-and-demo-accounts)
17. [How to run it locally (optional)](#17-how-to-run-it-locally-optional)
18. [How to demo to judges (3 minutes)](#18-how-to-demo-to-judges-3-minutes)
19. [What to say when judges ask hard questions](#19-what-to-say-when-judges-ask-hard-questions)
20. [Glossary](#20-glossary)
21. [Quick reference cheat sheet](#21-quick-reference-cheat-sheet)

---

## 1. The problem you’re solving

### The real-world pain

In Indian cities, people see broken roads, water leaks, garbage piles, dead streetlights — every day. Reporting these problems is usually:

- **Hard** — long forms, wrong department, no follow-up
- **Opaque** — you submit and never know what happened
- **Duplicated** — 50 people report the same pothole as 50 separate tickets
- **Slow** — a human clerk must read every complaint and sort it

Government apps like **Swachhata** proved citizens *will* report issues if you make it easy. But they don’t use modern AI to triage photos, predict hotspots, or run an automated “back office” of agents.

### The hackathon ask (Problem Statement 2: “Community Hero”)

Build a **hyperlocal civic platform** where residents can:

1. Report problems with **photos/video** and **location**
2. Use **AI** to categorize and prioritize issues
3. Show issues on a **map**
4. Let the **community verify** reports (upvotes)
5. **Track** status in real time
6. Show **impact dashboards** for stakeholders
7. Use **predictive insights** (where problems will cluster)
8. **Gamify** participation (points, leaderboard — ethically)

**You built all of this**, plus extra features that help you win (agents, Open311, assistant, etc.).

---

## 2. Your solution in one sentence

> **Snap a photo → AI understands it in ~3 seconds → it appears on a live map → neighbors verify → AI routes it to the right department with an SLA deadline → admin resolves with proof → everyone sees the timeline.**

Shorter tagline: **See it. Report it. Verify it. Resolve it.**

---

## 3. How a citizen uses the app (story)

Imagine **Priya** in Bengaluru sees a pothole.

| Step | What Priya does | What the system does |
|------|-----------------|----------------------|
| 1 | Opens the app, taps **Enter as demo citizen** (or Google sign-in) | Creates a user profile in Firebase |
| 2 | Taps **+ Report** | Opens the 3-step report wizard |
| 3 | Takes/uploads a **photo** (or records **voice** / short **video**) | Optional: resizes image, sends to Gemini for analysis |
| 4 | Waits ~3 seconds on “Analyzing…” | **Gemini Vision** returns: category (pothole), severity (1–5), title, description, department, confidence % |
| 5 | Confirms **location** on map (GPS or drag pin) | Reverse geocoding → human-readable address |
| 6 | Taps **Submit** | Creates a Firestore “issue” document; **6 AI agents** run (see Section 8) |
| 7 | Lands on **issue detail page** | Shows photo, timeline, department, SLA, agent steps |
| 8 | Shares link; neighbors tap **Boost ↑** | Upvote count rises; at 3 boosts → “Community Verified” |
| 9 | Gets **notifications** when status changes | Stored in `/notifications` |
| 10 | Later sees status → **Resolved** with before/after proof | Trust: public accountability |

**If AI is unsure** (confidence below ~70%): issue stays as **Draft** until an admin **approves** it (Judge HITL — human-in-the-loop). This prevents bad AI reports from polluting the public map.

---

## 4. How an authority uses the app (story)

Imagine **Ravi**, a municipal coordinator.

| Step | What Ravi does | What the system does |
|------|----------------|----------------------|
| 1 | Signs in as **demo authority** (admin) | Firebase custom claim `admin: true` |
| 2 | Opens **Admin console** (`/admin`) | Sees priority-sorted queue, SLA breaches, Judge review tab |
| 3 | Reads **Authority co-pilot** card | Heuristic dispatch plan: crew, materials, cost-of-inaction ₹ estimate |
| 4 | Filters **judge (N)** tab | Lists Draft / low-confidence issues |
| 5 | Taps **Approve & publish** | Draft → Submitted; citizen gets notification |
| 6 | Changes status: Assigned → In Progress → Resolved | Each change logged on public timeline |
| 7 | On Resolve, uploads **proof photo** | Gemini compares before/after; badge on issue |
| 8 | Exports **Open311** JSON (bulk or per-issue) | Standard format municipalities already understand |

---

## 5. The 8 official hackathon features

These are what the problem statement explicitly asks for. **You have all eight.**

| # | Feature | Plain English | Where in the app |
|---|---------|---------------|------------------|
| **1** | Image & video reporting | Citizen captures evidence, not just text | `/report` — 3-step wizard (Photo / Voice / Video) |
| **2** | AI categorization | AI reads the photo and fills the form | `POST /api/reports/analyze` — Gemini 2.5 Flash |
| **3** | Geo & mapping | Every issue is pinned on a map | `/map`, Google Maps markers, ward GeoJSON API |
| **4** | Community verification | Neighbors confirm “yes, this is real” | **Boost** button on issue detail; tiers at 1, 3, 10 upvotes |
| **5** | Real-time tracking | Citizen sees status history | `/issues/:id` timeline + `/my-reports` + notifications |
| **6** | Impact dashboards | Stats for officials and public | `/dashboard` — KPIs, charts, hotspots map |
| **7** | Predictive insights | “Where will problems cluster next?” | `/api/analytics/hotspots`, AI insight card, Agent 6 |
| **8** | Gamification | Reward civic participation | Points, badges, `/leaderboard` (opt-in only) |

---

## 6. Bonus features you built beyond the 8

These are **not** required by the problem statement but are your **competitive moats** for finals.

| Feature | What it does | Why it matters |
|---------|--------------|----------------|
| **6-agent pipeline** | Automated back-office after every report | Scores “agentic depth” (20% of judging) |
| **Civic AI assistant** | Chatbot that queries *live* issue data | “How many potholes near me?” — grounded answers, not hallucinations |
| **Open311 export** | Standard municipal data format | FixMyStreet parity — “enterprise ready” |
| **Department scorecards** | A–D grades per department | Accountability narrative for slides |
| **Complaint draft** | Email / WhatsApp / copy formal complaint | Citizen escalation beyond the app |
| **Cost of inaction** | ₹/day estimate if issue stays open | Helps authorities prioritize |
| **Authority co-pilot** | Dispatch checklist on admin | Shows AI helping *officials*, not only citizens |
| **Judge HITL** | Admin approves low-confidence reports | Responsible AI story |
| **Triple-layer dedup** | Visual + geo + semantic duplicate detection | Fewer duplicate pins on map |
| **Embed map widget** | iframe for RWAs / news sites | Distribution without app install |
| **7-language UI** | en, hi, mr, ta, bn, te, kn | Inclusivity; language picker on every page |
| **Offline queue** | Save report when no network | PWA resilience |
| **Activity / threads** | Geohash-clustered nearby discussions | CivicThreads-inspired social layer |
| **Comments** | Public discussion per issue | Community voice |
| **Before/after proof slider** | Visual resolution verification | Swachhata-style trust |
| **76 automated tests** | Server unit + integration tests | Technical credibility |
| **123 verify-phases checks** | Script probes production | “It actually works live” |

---

## 7. What makes your project unique

### vs Swachhata (government citizen app)

| Swachhata has | You add |
|---------------|---------|
| Photo + GPS + upvote | **AI vision triage in ~3 seconds** |
| Status updates | **6 autonomous agents** (routing, SLA, dedup, insights) |
| Large scale (4000+ cities) | **Predictive hotspots** + Gemini trend narratives |
| — | **Open311 export** for municipal systems |

### vs FixMyStreet (global gold standard)

| FixMyStreet has | You add |
|-----------------|---------|
| Map reporting, Open311 | **Gemini multimodal AI** on every photo |
| Authority routing | **Gamification** + verification tiers |
| Mature UX | **Google AI Studio → Cloud Run** deploy path (hackathon requirement) |

### vs typical hackathon demos

| Others often have | You have |
|-------------------|----------|
| Single ChatGPT wrapper | **Six specialized agents** with Firestore audit trail |
| Fake/mock data only | **49 seeded real issues** across 5 Indian cities |
| Slides only | **Live production URL** + 123 automated checks |
| Chat UI theatre | **NDJSON streaming agent steps** on real submit |

**Your winning formula (memorize this):**

> Swachhata-grade community participation + InfraGuard-grade AI speed + six-agent automation + Open311 municipal export + live Google stack on Cloud Run.

---

## 8. The six AI agents (explained simply)

When a citizen submits a report, your backend doesn’t just “save to database.” It runs **six named agents** in order. Think of them as six specialist employees who never sleep.

```
Citizen submits photo
        ↓
┌───────────────────────────────────────────────────────────┐
│  Agent 1: INTAKE     — Is this a real civic issue? Safe?  │
│  Agent 2: VISION     — Gemini classifies photo (category) │
│  Agent 3: DEDUP      — Same pothole already reported?     │
│  Agent 4: ROUTING    — Which department? SLA deadline?    │
│  Agent 5: COMMUNICATOR— Citizen-friendly status message    │
│  Agent 6: INSIGHTS    — Ward patterns, hotspot risk       │
└───────────────────────────────────────────────────────────┘
        ↓
Issue appears on map (unless Draft / needs review)
```

| Agent | Job | Example output |
|-------|-----|----------------|
| **1. Intake** | Gatekeeper — reject spam/non-civic | `isCivic: true`, safe search passed |
| **2. Vision** | Read the image | `category: pothole`, `severity: 4`, `confidence: 0.92` |
| **3. Dedup** | Find duplicates | “92% similar to issue 3 blocks away” (geo + embedding) |
| **4. Routing** | Assign department + priority | `Roads & Infrastructure`, SLA 72h, `priorityScore: 85` |
| **5. Communicator** | Write human messages | English + Hindi narrative for notifications |
| **6. Insights** | Analytics on this report | “3 open potholes in this ward; recurring pattern” |

**Judge gate:** If Vision confidence &lt; ~70%, status = **Draft** + `needs_review`. Admin must approve before public map.

**What the user sees:** An **agent stepper** UI on report submit and issue detail — each agent lights up as it completes (streamed live on submit).

---

## 9. Every screen in the app

The app is **mobile-first** (designed for phone width ~390px). Bottom navigation: Home, Map, + Report, Activity, Profile.

| Route | Page name | Who uses it | What you see |
|-------|-----------|-------------|--------------|
| `/` | **Landing** | Everyone | Hero, live stats (49 issues), trending/recent, CTAs |
| `/map` | **Map explorer** | Everyone | Google Maps + colored markers, filters, list fallback |
| `/report` | **Report wizard** | Signed-in users | 3 steps: Capture → Describe → Confirm + AI card |
| `/issues/:id` | **Issue detail** | Everyone | Photo, boost, timeline, agents, complaint card, cost of inaction |
| `/my-reports` | **My reports** | Citizens | Your submissions + SLA countdown |
| `/dashboard` | **Civic dashboard** | Everyone | KPIs, charts, hotspot map, AI insight |
| `/scorecards` | **Department scorecards** | Everyone | A–D grades, SLA compliance per department |
| `/leaderboard` | **Leaderboard** | Opt-in users | Weekly + all-time civic champions |
| `/assistant` | **Civic AI** | Signed-in | Chat with 7 tools (nearby issues, search, stats…) |
| `/activity` | **Activity** | Everyone | Nearby geohash threads |
| `/threads/:id` | **Thread detail** | Everyone | Cluster discussion |
| `/notifications` | **Notifications** | Signed-in | Status change alerts |
| `/profile` | **Profile** | Signed-in | Points, badges, settings, links |
| `/login` | **Login** | Everyone | Demo citizen, demo authority, Google, guest |
| `/admin` | **Admin console** | Admins | Queue, judge tab, co-pilot, bulk status, CSV export |
| `/admin/analytics` | **Admin analytics** | Admins | Deep charts, ward heatmap |
| `/embed/map` | **Embed widget** | External sites | iframe-friendly mini map |
| `/terms`, `/privacy`, `/gamification-rules` | Legal / rules | Everyone | Compliance copy |
| `/waiting` | **Rate limit** | Everyone | Shown when too many requests (429) |

**Language picker:** Top-right on every page — 7 Indian languages.

---

## 10. Issue lifecycle (statuses)

Every issue moves through a **state machine**. Citizens and admins see this on the timeline.

```
Draft  →  Submitted  →  Community Verified  →  Assigned  →  In Progress  →  Resolved  →  Closed
  ↑              ↑
  │              └── Admin can set Submitted after Judge approve
  └── Low AI confidence OR intake failed
```

| Status | Meaning |
|--------|---------|
| **Draft** | Hidden from public map; needs admin review |
| **Submitted** | Live on map; awaiting community or department action |
| **Community Verified** | Enough neighbor boosts (≥3) confirmed it’s real |
| **Assigned** | Department owns the ticket |
| **In Progress** | Crew working on it |
| **Resolved** | Fixed; proof photo uploaded |
| **Closed** | Final state |

**SLA:** Each category has hours-to-fix by severity. If deadline passes → `slaBreached: true` (red badge in admin).

---

## 11. Issue categories and departments

AI classifies into **9 categories**:

| Category | Example | Routed to department |
|----------|---------|----------------------|
| `pothole` | Road hole | Roads & Infrastructure |
| `water_leak` | Pipe burst | Water Board |
| `streetlight` | Dark street | Electrical |
| `waste` | Garbage dump | Sanitation |
| `road_damage` | Cracked road | Roads & Infrastructure |
| `drainage` | Flooded drain | Stormwater |
| `signage` | Broken sign | Signage & Traffic |
| `encroachment` | Illegal stall | Enforcement |
| `other` | Anything else | General |

**Severity:** 1 (minor) to 5 (critical). Higher severity → shorter SLA → higher priority score.

---

## 12. Community verification and gamification

### Verification tiers (upvotes / “Boost”)

| Boosts | Verification level | Effect |
|--------|-------------------|--------|
| 1+ | Acknowledged | Counted |
| 3+ | Community Verified | Status may upgrade from Submitted |
| 10+ | Priority Escalation | Highest verification level |

### Civic points & badges (ethical gamification)

- Points for: reporting, receiving upvotes, resolved issues, etc.
- **Leaderboard is opt-in only** (privacy-first — say this to judges)
- Badges: First Reporter, Neighborhood Voice, Civic Champion, etc.
- Rules page: `/gamification-rules`

---

## 13. Tech stack — what each piece does

You don’t need to code to understand this table.

| Technology | Role | Analogy |
|------------|------|---------|
| **React + Vite** | Frontend UI | The storefront customers see |
| **Express (Node.js)** | Backend API | The kitchen + business logic |
| **Cloud Run** | Hosting | One container running your app 24/7 in Google Cloud |
| **Firebase Auth** | Login | Bouncer — knows who is citizen vs admin |
| **Cloud Firestore** | Database | Filing cabinet for issues, users, events |
| **Firebase Storage** | Photo storage | Warehouse for uploaded images |
| **Gemini 2.5 Flash** | AI brain | Reads photos, chats, compares before/after |
| **Google Maps** | Maps | Pins issues on real streets |
| **PWA / Service Worker** | Offline support | App-like install, queue when offline |
| **GitHub Actions** | CI/CD | Auto-test on every push |
| **Open311** | Export format | USB standard for municipal software |

**Architecture in one line:** Browser talks to **one Cloud Run URL** → Express serves API + static website → Express talks to Firebase + Gemini + Maps.

---

## 14. How the code is organized (folders)

```
Vibe2Ship/
├── frontend/          ← Everything the user sees (React pages, components)
│   └── src/pages/     ← One file per screen (Landing.tsx, MapExplorer.tsx, …)
├── server/            ← Backend API + AI agents
│   └── src/
│       ├── routes/    ← API endpoints (reports.ts, analytics.ts, ai.ts, …)
│       └── lib/agents/← The 6 agents (intake, vision, dedup, routing, …)
├── shared/types.ts    ← Shared definitions (Issue, Category, Status)
├── docs/              ← All documentation (you are here)
├── scripts/           ← deploy, seed data, verify production, screenshots
├── Dockerfile         ← Recipe to build production container
└── firebase.json      ← Firestore security rules + indexes
```

**Key files to know exist (you don’t need to edit them for demos):**

| File | Purpose |
|------|---------|
| `frontend/src/lib/api.ts` | Frontend calls to backend |
| `frontend/src/lib/auth.tsx` | Login state |
| `server/src/routes/reports.ts` | Create issue, upvote, approve, status |
| `server/src/lib/gemini.ts` | All Gemini AI calls |
| `scripts/verify-phases.sh` | Proves production works (123 checks) |
| `docs/demo/APPENDIX-I-DEMO-SCRIPT.md` | Word-for-word 3-min demo |

---

## 15. Where data lives (database)

Firestore collections (think: tables):

| Collection | Stores |
|------------|--------|
| `issues` | Every reported problem (title, lat, status, photos, AI metadata) |
| `issues/{id}/events` | Timeline entries (status change, upvote, agent steps) |
| `issues/{id}/comments` | Public comments |
| `users` | Profile, points, badges, leaderboard opt-in |
| `notifications` | Alerts sent to citizens |
| `hotspots` | Predictive risk clusters |
| `insights` | Latest batch analytics narrative |
| `analytics` | Cached dashboard summaries |

**Demo data:** 49 seeded issues across **Bengaluru, Delhi, Hyderabad, Mumbai, Chennai** (9 resolved with before/after photos).

---

## 16. URLs, login, and demo accounts

### Production (use this for judging)

| What | URL |
|------|-----|
| **Main app** | https://community-hero-987477089222.asia-south1.run.app |
| **Health check** | …/api/health |
| **GitHub** | https://github.com/Ojas-Srivastava05/community-hero |

### How to sign in (recommended for stage)

**Do NOT rely on Google OAuth on stage** (popups get blocked).

1. Go to `/login`
2. **Enter as demo citizen** — for reporting, map, assistant
3. **Enter as demo authority** — for admin panel (separate browser tab)

### What each demo account can do

| Account | Can do | Cannot do |
|---------|--------|-----------|
| Demo citizen | Report, boost, chat, see notifications | Admin status changes |
| Demo authority | Everything citizen can + admin queue, approve drafts, resolve | — |
| Guest | Browse map, view issues | Submit reports |
| Google | Full account (production domains configured) | May fail if popup blocked |

---

## 17. How to run it locally (optional)

Only needed if you want to change code. For judging, **production URL is enough**.

```bash
# Terminal 1 — API
cd server && cp ../.env.example .env && npm install && npm run dev   # port 3001

# Terminal 2 — Website
cp .env.example frontend/.env && cd frontend && npm install && npm run dev   # port 5173
```

Open http://localhost:5173 — it proxies API calls to :3001.

**Seed demo data:** `cd server && npx tsx scripts/seed-firestore.ts`

**Verify production:** `bash scripts/verify-phases.sh` → expect 123 passed

---

## 18. How to demo to judges (3 minutes)

Use **incognito phone browser**. Pre-open two tabs: demo citizen + demo authority.

| Time | Show | Say |
|------|------|-----|
| 0:00–0:20 | Landing → demo login | “Live on Cloud Run, not a prototype” |
| 0:20–0:45 | Map → filter pothole → open issue | “48+ issues, 5 cities, geotagged” |
| 0:45–1:10 | Issue detail: boost, complaint email, cost of inaction, agents | “Community verifies; AI routes to department” |
| 1:10–1:50 | Report wizard → AI analyze → submit | “Gemini classifies in under 3 seconds; six agents run” |
| 1:50–2:10 | Dashboard + scorecards | “Impact for municipal stakeholders” |
| 2:10–2:30 | Assistant: “What open potholes near me?” | “Grounded in live data, not hallucinated” |
| 2:30–2:50 | Admin: co-pilot, judge approve, resolve | “Closes the loop with proof; Open311 export” |

**Closing line:**

> “We’re the only finalist with municipal Open311 export, a six-agent audit trail, Judge human-in-the-loop, authority co-pilot, 76 tests, and a live multi-city demo — built to ship, not just to pitch.”

Full script: [`docs/demo/APPENDIX-I-DEMO-SCRIPT.md`](demo/APPENDIX-I-DEMO-SCRIPT.md)

---

## 19. What to say when judges ask hard questions

| Question | Short answer |
|----------|--------------|
| “How is this different from Swachhata?” | “Swachhata proved citizen reporting works. We add sub-3-second AI triage, six autonomous agents, predictive hotspots, and Open311 export.” |
| “Is the AI safe?” | “Low-confidence reports stay Draft until an admin approves. Every agent step is logged on the public timeline.” |
| “Does it scale?” | “Geohash indexes, Cloud Run autoscaling, Firestore. Rate limits backed by Firestore in production.” |
| “What Google tech?” | “AI Studio origin, Gemini 2.5 Flash, Cloud Run, Firestore, Firebase Auth, Storage, Maps.” |
| “Can municipalities adopt it?” | “Open311 GeoReport v2 export today; department scorecards and SLA matrix built in.” |
| “Gamification ethics?” | “Leaderboard is opt-in only. Points reward civic participation, not vanity.” |
| “Is it really live?” | “Run `verify-phases.sh` — 123 checks against production. Health endpoint shows Firestore connected.” |

More: [`docs/COMPETITIVE-MATRIX.md`](COMPETITIVE-MATRIX.md)

---

## 20. Glossary

| Term | Meaning |
|------|---------|
| **PWA** | Progressive Web App — website that feels like a native app |
| **SLA** | Service Level Agreement — deadline by when issue should be fixed |
| **HITL** | Human-in-the-loop — human approves when AI is unsure |
| **Geohash** | Short code for a geographic area (used for clustering & dedup) |
| **Open311** | Standard API format cities use for civic requests |
| **NDJSON** | Newline-delimited JSON — streams agent steps live during submit |
| **Firestore** | Google’s NoSQL cloud database |
| **Gemini** | Google’s AI model family (you use 2.5 Flash) |
| **Cloud Run** | Runs your Docker container without managing servers |
| **Agent** | Automated specialist module (not just one big chatbot) |
| **Boost** | Upvote on an issue |
| **Ward** | Municipal administrative zone (demo GeoJSON for 5 cities) |

---

## 21. Quick reference cheat sheet

**Print this page mentally before any meeting.**

```
PRODUCT:     Community Hero (CIVICPULSE AI)
HACKATHON:   Vibe2Ship PS2 — Community Hero
URL:         https://community-hero-987477089222.asia-south1.run.app
LOGIN:       /login → Enter as demo citizen | demo authority
CORE LOOP:   Photo → AI → Map → Verify → Route → Resolve
AGENTS:      Intake → Vision → Dedup → Routing → Communicator → Insights
UNIQUE:      6 agents + Open311 + Judge HITL + co-pilot + live 5-city demo
8 FEATURES:  Report, AI, Map, Verify, Track, Dashboard, Insights, Gamify — ALL DONE
TESTS:       76 unit tests | 123 production verify checks
DEMO TIME:   2:50 script in docs/demo/APPENDIX-I-DEMO-SCRIPT.md
PITCH:       "Snap → AI triages in 3s → neighbors verify → agents route → public timeline"
```

---

## What to read next

| Document | When |
|----------|------|
| [`docs/demo/APPENDIX-I-DEMO-SCRIPT.md`](demo/APPENDIX-I-DEMO-SCRIPT.md) | Before presenting |
| [`docs/PRODUCT-VISION.md`](PRODUCT-VISION.md) | 30-second pitch |
| [`docs/COMPETITIVE-MATRIX.md`](COMPETITIVE-MATRIX.md) | Before Q&A |
| [`docs/architecture.md`](architecture.md) | If a technical judge goes deep |
| [`README.md`](../README.md) | Quick links and deploy commands |

---

*You built a full civic intelligence platform — not a homework assignment. This guide is your map. Read Sections 1–8 before finals; keep Section 21 in your head on stage.*

**Author:** Generated for Ojas Srivastava · Community Hero · Vibe2Ship 2026
