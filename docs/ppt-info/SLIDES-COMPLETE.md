# Community Hero — Complete Presentation Kit (Appendix P)

15 slides with **full speaker notes** for Vibe to Ship / BlockseBlock 2026 jury presentation.

**Build in:** Google Slides or PowerPoint  
**Export:** PDF backup to Google Drive  
**Demo URL:** https://community-hero-987477089222.asia-south1.run.app  
**QR code:** See `docs/demo/QR-CODE.md`

---

## Slide 01 — Guidelines & Evaluation

**Title:** Community Hero — Vibe2Ship 2026

**On-slide content:**
- Hackathon: Vibe to Ship (BlockseBlock 2026)
- Problem Statement 2: Community Hero — hyperlocal civic issue reporting
- Evaluation lens: innovation, Google tech depth, impact, demo quality, documentation
- Three mandatory links: live app, GitHub, Google Doc

**Speaker notes (full):**

Open with energy and brevity—you have three minutes total including Q&A buffer. State clearly: "We built Community Hero, codename CIVICPULSE AI, for Problem Statement 2." Name the evaluation criteria judges care about: 20% impact, 20% agentic depth, 20% innovation—we designed every architectural decision to score on those three. Mention that everything you will see is live on Cloud Run today, not a slide deck prototype. Point to the submission table: deployed URL, public GitHub, and Google Doc with all ten Appendix J sections. Transition: "Let me introduce the team, then the problem we solve."

**Timing:** 30 seconds

---

## Slide 02 — Team

**Title:** Team

**On-slide content:**

| Role | Name | Focus |
|------|------|-------|
| Tech Lead / Full-stack | Ojas Srivastava | Architecture, Cloud Run, GitHub, docs |
| AI / Agent Engineer | TBD | 6 agents, Gemini prompts, chat tools |
| Frontend / UX | TBD | PWA, map, wizard, Civic Glass UI |
| Data / Geo | TBD | Firestore, geohash, seed data |
| DevOps / Submission | TBD | Deploy, BlockseBlock, Google Doc |

GitHub: https://github.com/Ojas-Srivastava05/community-hero

**Speaker notes (full):**

Introduce cross-functional coverage even if some roles are consolidated on a small team. Ojas owns architecture, deployment, and documentation—the jury can audit every line on GitHub. Call out who will drive the live demo (typically Tech Lead or Frontend). Emphasize that AI Studio export, Cloud Run deploy, and Firestore schema were built in a seven-day sprint with Cursor-assisted development. If asked about team size, note that role matrix in `docs/TEAM-ROLES.md` shows how work would scale. Do not spend more than 20 seconds here.

**Timing:** 20 seconds

---

## Slide 03 — Problem

**Title:** Civic reporting is fragmented and opaque

**On-slide content:**
- Millions of urban complaints annually across 4,000+ Indian cities
- Citizens use WhatsApp groups, municipal portals, ad-hoc apps—no shared record
- Manual triage delays routing; duplicate reports waste field crews
- Residents lack visibility: submitted → assigned → resolved timelines rarely public
- Swachhata proved demand but lacks AI triage, agentic routing, predictive prevention

**Speaker notes (full):**

Make it personal: "Have you ever reported a pothole and never heard back?" Cite Swachhata's 4,000+ city scale as proof of demand, but explain the gap—no sub-3-second AI classification, no six-agent automation, no predictive hotspots. Contrast with FixMyStreet's mature UX but missing Gemini vision. Optionally show one real pothole photo (stock or from seed data). The pain point is opacity: citizens cannot verify that their report reached the right department or track SLA compliance. Municipalities drown in duplicate photos of the same leak. This sets up our USP slide—do not jump to features yet.

**Timing:** 40 seconds

---

## Slide 04 — USP (Unique Value Proposition)

**Title:** Why Community Hero wins

**On-slide content:**

| USP | Benefit |
|-----|---------|
| 3-second AI triage | Photo → structured municipal-ready report via Gemini Vision |
| Community verification | Crowd upvotes reduce duplicate noise (~40% fewer dupes) |
| 6-agent orchestration | Auto-routing, SLA deadlines, dedup, priority—no manual desk |
| Public accountability | Named status timeline shareable on WhatsApp |
| Predictive hotspots | Shift from reactive complaints to preventive maintenance |

**Speaker notes (full):**

This is your differentiation slide—judges score innovation and impact here. "Same engineering rigor as enterprise logistics platforms—mission is communities, not cargo." Quantify: 80% faster triage vs manual municipal forms (design target from master plan Section 34). Explain community verification tiers at 1, 3, and 10 upvotes—this is Swachhata-grade social proof plus InfraGuard-grade AI speed. Agentic orchestration is not marketing language: six deterministic agents run on every submit (show diagram on next architecture slides). Predictive hotspots use geohash-6 density—departments can deploy crews before complaints spike. If short on time, pick three USPs and go deep on agentic + vision.

**Timing:** 45 seconds

---

## Slide 05 — Features (8 Official)

**Title:** Eight features — production on Cloud Run

**On-slide content:**

1. **3-step report wizard** — Photo capture, GPS pin, Gemini Vision prefill
2. **Google Maps explorer** — Severity markers + list fallback for low bandwidth
3. **Issue detail & timeline** — Status history, department, SLA countdown
4. **Community upvote verification** — Tiers at 1 / 3 / 10 votes → Community Verified
5. **6-agent pipeline** — Vision, routing, SLA, dedup, priority, gamification
6. **Admin panel** — Status updates, proof photo, resolution workflow
7. **Impact dashboard** — Recharts summary, hotspots, trend insights, Open311 export
8. **Civic assistant** — Gemini chat with tool calling over live issue data

**Speaker notes (full):**

Do not read all eight bullets—judges have the Google Doc. Pick three for depth: (1) report wizard with live AI analyze, (2) map + community verify, (3) dashboard + assistant. Say explicitly: "All eight Vibe2Ship example features are implemented—see Section 3 of our Google Doc with screenshot placeholders." Mention Open311 export for municipal interoperability—FixMyStreet parity. Note ethical gamification: opt-in leaderboard, points for civic participation not vanity metrics. Transition: "Let me walk the citizen journey before we open the app."

**Timing:** 40 seconds (or fold into demo)

---

## Slide 06 — Process Flow

**Title:** Citizen journey — photo to resolution

**On-slide content:**

```
Photo + GPS → Gemini classify → Firestore issue → Map pin
     → Neighbors upvote → Community Verified → Department assigned
     → In Progress → Resolved + proof photo → Points + badge
```

**Diagram:** Embed `docs/diagrams/png/05-report-intake-sequence.png` when rendered

**Speaker notes (full):**

Walk the happy path in 45 seconds before opening the app—judges need mental model first. Step 1: citizen captures photo, client resizes to WebP, GPS auto-captures. Step 2: server calls Gemini, returns JSON in under 3 seconds, user confirms. Step 3: six agents run—emphasize this is server-side, not client-side smoke. Step 4: issue appears on public map with severity color. Step 5: neighbor upvotes trigger verification tier and reporter points. Step 6: admin marks In Progress, then Resolved with proof image—timeline event visible to all. End state: gamification awards badge, Open311 export available. This sequence maps to `docs/diagrams/mermaid/05-report-intake-sequence.mmd`.

**Timing:** 45 seconds

---

## Slide 07 — Wireframes / Screenshots

**Title:** Civic Glass UI — mobile-first

**On-slide content:**

**Screens from production:**
1. Landing (`/`) — hero, sign-in CTA
2. Report wizard (`/report`) — step 2 AI analysis card
3. Map explorer (`/map`) — severity markers
4. Issue detail (`/issues/:id`) — timeline + upvote
5. Dashboard (`/dashboard`) — charts + hotspot card
6. Leaderboard (`/leaderboard`) — civic points

**Design:** Dark map-first, teal accent `#14B8A6` — `.stitch/DESIGN.md`

**Speaker notes (full):**

Use phone mockup frames—judges evaluate product experience at 10% weight. Civic Glass is intentional: dark background reduces glare outdoors, teal accent meets WCAG on severity chips. Capture screenshots from production URL in incognito after sign-in. If Maps tiles are gray (missing build-time API key), use list fallback screenshot and note deploy env var. One screenshot per feature area—do not crowd the slide. Mention 18 routes total including `/privacy`, `/admin/analytics`, `/waiting` rate-limit page. Accessibility: severity colors audited for AA contrast in Phase 17 QA.

**Timing:** 30 seconds (optional if demo-heavy)

---

## Slide 08 — Architecture

**Title:** System architecture

**On-slide content:**

**Diagram:** Embed `docs/diagrams/png/01-system-architecture.png`

**Layers:**
- **Client:** React 19 PWA, Firebase Auth SDK, Google Maps JS
- **Cloud Run:** Express API + static SPA, agent pipeline
- **Firebase:** Firestore, Cloud Storage, Auth
- **AI:** Gemini 2.0 Flash / Flash Lite

**Speaker notes (full):**

Key message: **single container deploy**—API and frontend share one Cloud Run service in `asia-south1`. Browser holds Firebase Auth session; every protected API call sends Bearer ID token. Server uses Firebase Admin SDK—secrets never in client bundle. Gemini calls are server-side only (`server/src/lib/gemini.ts`). Firestore is source of truth; Storage holds images. This architecture mirrors master plan Section 21 and is fully documented in `docs/architecture.md`. Judges technical implementation criterion: Zod validation, rate limiting, Firestore security rules in repo. Mention `GET /api/health` returns Firestore connection status for ops monitoring.

**Timing:** 50 seconds

---

## Slide 09 — Agent Workflow

**Title:** 6-agent orchestration

**On-slide content:**

**Diagram:** Embed `docs/diagrams/png/04-agent-workflow.png`

**Agents:** Intake → Vision → Routing → SLA → Dedup → Priority  
**Branches:** Low confidence → Draft review queue; duplicates → merge suggestions

**Speaker notes (full):**

This slide wins **Agentic Depth (20%)**—do not rush. Each agent is a discrete function in `server/src/lib/agents.ts`, not one mega-prompt. Vision runs pre-submit via `/api/reports/analyze`; others post-submit. Routing uses deterministic `DEPARTMENTS` map—auditable, not hallucinated. SLA agent sets deadline from category + severity matrix (Appendix L in master plan). Dedup queries geohash neighbors—~40% duplicate reduction claim. Priority score combines severity, safety_risk, confidence. Low confidence (&lt;0.6) routes to Draft—quality gate. Upvote processing is agent-adjacent: thresholds trigger Community Verified status and point awards. Contrast with "we wrapped ChatGPT": show conditional edges on diagram.

**Timing:** 55 seconds

---

## Slide 10 — Technology Stack

**Title:** Stack

**On-slide content:**

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind, Framer Motion, Recharts |
| Backend | Node.js, Express 5, Zod, Multer |
| Database | Cloud Firestore |
| Storage | Firebase Cloud Storage |
| Auth | Firebase Authentication (Google) |
| AI | Gemini API (`@google/generative-ai`) |
| Maps | Google Maps Platform |
| Deploy | Cloud Run `asia-south1`, Docker, GitHub Actions |

**Speaker notes (full):**

Stack is boring on purpose—maintainable, hireable, jury-auditable on GitHub. React 19 + Vite for fast PWA iteration. Express 5 chosen for AI Studio Node runtime compatibility. Zod schemas at API boundary—type safety end to end with TypeScript in `shared/types.ts`. Recharts for dashboard—no heavy BI dependency. Docker multi-stage build: frontend `npm run build` then server copies `dist/`. CI in `.github/workflows/ci.yml` runs frontend build, server `tsc`, priority unit test. Makefile targets: `make test`, `make verify`, `make deploy`. Do not dwell—30 seconds unless asked about alternatives.

**Timing:** 30 seconds

---

## Slide 11 — Google Technologies

**Title:** Built on Google Cloud & AI

**On-slide content:**
- **Google AI Studio** — prototype → export → Cloud Run publish path
- **Gemini 2.0 Flash** — vision classification, dashboard insights, civic assistant
- **Firebase Auth** — Google Sign-In, ID tokens for API
- **Cloud Firestore** — realtime issue data, geohash queries
- **Cloud Storage** — report and proof images
- **Google Maps Platform** — map tiles + server reverse geocoding
- **Cloud Run** — production HTTPS hosting

**Speaker notes (full):**

Maps each Google product to a **visible demo feature**—judges score Google Technologies at 15%. AI Studio: "We started in Build mode, exported to GitHub, deploy via Cloud Build." Gemini: live on report wizard, dashboard insight card, assistant chat—three distinct use cases. Firebase Auth: sign in on slide 12 demo first action. Firestore: map updates, timeline events—realtime without custom WebSocket server. Storage: show image on issue detail. Maps: explorer slide. Cloud Run: URL on every slide footer. Mention project isolation: `community-hero-vibe2ship`. If jury asks about cost: Flash Lite for text, Flash for vision, geohash dedup avoids embedding API costs in MVP.

**Timing:** 45 seconds

---

## Slide 12 — Live Demo

**Title:** 3-minute demo script

**On-slide content:**

**QR code:** https://community-hero-987477089222.asia-south1.run.app  
(Generate QR from `docs/demo/QR-CODE.md`)

| Minute | Action |
|--------|--------|
| 0:00 | Landing → Sign in with Google |
| 0:20 | Map → filter potholes → open seeded issue |
| 0:45 | Issue detail → upvote → verification tier |
| 1:10 | Report wizard → photo → AI analyze → submit |
| 1:50 | Dashboard → charts + hotspot |
| 2:10 | Assistant → "What open issues are near me?" |
| 2:30 | Admin → mark In Progress (admin account) |
| 2:50 | GitHub + Google Doc + stack recap |

**Backup:** https://community-hero-eight.vercel.app

**Speaker notes (full):**

This is the most important slide—rehearse twice timed per `docs/demo/REHEARSAL-CHECKLIST.md`. Pre-open incognito tab on phone; laptop for projector mirror. QR code lets judges follow along on their devices. If sign-in fails, check Firebase authorized domain includes Cloud Run hostname. If Maps gray, use list view on `/map`. If Gemini key missing, wizard still works with keyword fallback—acknowledge honestly. Seeded ward `DEMO_WARD_001` ensures map is not empty after `make seed`. Keep second device ready for upvote demo OR use pre-upvoted seeded issue. End at 2:50 with GitHub repo and Google Doc—do not overrun into Q&A time. Backup video steps in rehearsal checklist if live demo fails.

**Timing:** 3:00 (entire demo block)

---

## Slide 13 — Impact Metrics

**Title:** Measurable impact (demo + design targets)

**On-slide content:**

| Metric | Target / claim |
|--------|----------------|
| Triage time | **80% faster** vs manual municipal forms |
| Duplicate reduction | **~40%** via geohash dedup + community verify |
| AI classification | **90%+** accuracy on demo ward set |
| API latency | Sub-**3s** vision analyze; **&lt;5s** full submit P95 |
| Transparency | 100% issues have public status timeline |
| Engagement | Gamification — points, badges, opt-in leaderboard |

**Speaker notes (full):**

Cite industry context: Swachhata scale proves citizen demand; InfraGuard proves ~3s vision is achievable—we combine both plus agents. Numbers are design targets from master plan Section 34, validated on seeded demo ward—not production municipal deployment (honest framing). 80% triage: manual forms require desk clerk to categorize; we automate in one API call. 40% dupes: geohash range + upvote merge suggestions. 90% accuracy: test against 25 seed issues in `server/scripts/seed-firestore.ts`. Latency: L2 image cache in `server/src/lib/gemini.ts`. Transparency: every public issue has `events` subcollection. Engagement: ethical gamification—opt-in leaderboard, no dark patterns. If challenged, point to `docs/COMPETITIVE-MATRIX.md`.

**Timing:** 40 seconds

---

## Slide 14 — Links

**Title:** Submission links

**On-slide content:**

| Item | URL |
|------|-----|
| **Deployed app** | https://community-hero-987477089222.asia-south1.run.app |
| **GitHub** | https://github.com/Ojas-Srivastava05/community-hero |
| **Vercel preview** | https://community-hero-eight.vercel.app |
| **Google Doc** | _(paste public view link before submit)_ |
| **BlockseBlock** | _(dashboard URL after final submit)_ |

**Speaker notes (full):**

Before BlockseBlock final submit, open all three mandatory links in incognito on your phone—verification gate from Phase 18. Google Doc must include all ten Appendix J sections from `docs/submission/GOOGLE-DOC-CONTENT.md`. GitHub README has architecture links, eight-feature table, team section. Tag `v1.0.0-submission` created by `scripts/prepare-submission.sh`. Remind jury: BlockseBlock Final Submit is irreversible—triple-check URLs. Vercel is optional backup if Cloud Run cold-starts—mention `min-instances` if configured. Offer to screen-share repo `docs/` folder if documentation depth questioned.

**Timing:** 25 seconds

---

## Slide 15 — Closing

**Title:** Every pothole deserves a public record and a named resolution.

**On-slide content:**
- Community Hero turns citizen photos into accountable, routed, verifiable civic records
- AI + agents + community = faster fixes and public trust
- Open source on GitHub; live on Cloud Run today
- Thank you — questions?

**Contact:** Ojas Srivastava — Tech Lead

**Speaker notes (full):**

Close with the thesis line—memorable, mission-driven. Restate three pillars: Gemini vision (speed), six agents (depth), community verify (trust). "We shipped working software in seven days—not slideware." Invite questions: architecture, Firestore rules, agent design, Open311 export, roadmap (ADK, multilingual voice). If silence, offer to re-run 30-second report wizard. Thank judges for their time. Keep slide visible during Q&A with QR code and GitHub URL in footer.

**Timing:** 20 seconds + Q&A

---

## Export checklist

- [x] All 15 slides specified with full speaker notes (`docs/ppt-info/SLIDES-COMPLETE.md`)
- [ ] Screenshots captured from production URL (manual — use placeholders in Google Doc)
- [ ] Architecture + agent workflow PNGs embedded (slides 08–09) — render from `docs/diagrams/mermaid/`
- [ ] QR code on slide 12 (`docs/demo/QR-CODE.md`)
- [ ] Team names finalized on slide 02 (`docs/TEAM-ROLES.md`)
- [ ] Google Doc link added to slide 14 before BlockseBlock submit
- [ ] PDF export uploaded to Google Drive as backup

**Total presentation time (slides only, no demo):** ~8 minutes  
**With live demo:** ~11 minutes — trim slides 07 and 10 if jury enforces 10-minute cap
