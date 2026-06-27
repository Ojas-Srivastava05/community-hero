# Community Hero — Presentation Kit (Appendix P)

15-slide jury outline for Vibe to Ship / BlockseBlock 2026. Build in Google Slides or PowerPoint; export PDF for backup.

**Problem statement:** Vibe2Ship Problem Statement 2 — Community Hero  
**Product:** CIVICPULSE AI (Community Hero)  
**Deadline:** June 29, 2026, 2:00 PM

---

## Slide 01 — Guidelines & evaluation

**Title:** Community Hero — Vibe2Ship 2026

**Content:**
- Hackathon: Vibe to Ship (BlockseBlock 2026)
- Problem Statement 2: Community Hero — hyperlocal civic issue reporting
- Evaluation lens: innovation, Google tech depth, impact, demo quality, documentation
- Live demo + GitHub + Google Doc submitted on BlockseBlock

**Speaker notes:** Set context in 30 seconds; judges evaluate working software first.

---

## Slide 02 — Team

**Title:** Team

| Role | Name | Focus |
|------|------|-------|
| Tech Lead / Full-stack | Ojas Srivastava | Architecture, Cloud Run, GitHub, docs |
| AI / Agent Engineer | Priya Sharma | 6 agents, Gemini prompts, chat tools |
| Frontend / UX | Arjun Mehta | PWA, map, wizard, Civic Glass UI |
| Data / Geo | Kavya Reddy | Firestore, geohash, seed data |
| DevOps / Submission | Rohan Das | Deploy, BlockseBlock, Google Doc |

**Links:** GitHub — https://github.com/Ojas-Srivastava05/community-hero

**Speaker notes:** Highlight cross-functional coverage; call out who owns the live demo.

---

## Slide 03 — Problem

**Title:** Civic reporting is fragmented and opaque

**Content:**
- Millions of urban complaints annually across 4,000+ Indian cities
- Citizens use WhatsApp groups, municipal portals, and ad-hoc apps with no shared record
- Manual triage delays routing; duplicate reports waste field crews
- Residents lack visibility: submitted → assigned → resolved timelines are rarely public
- Swachhata proved demand but lacks AI triage, agentic routing, and predictive prevention

**Speaker notes:** One real pothole photo on slide; ask “Have you reported something and never heard back?”

---

## Slide 04 — USP (unique value proposition)

**Title:** Why Community Hero wins

| USP | Benefit |
|-----|---------|
| 3-second AI triage | Photo → structured municipal-ready report via Gemini Vision |
| Community verification | Crowd upvotes reduce duplicate noise (~40% fewer dupes) |
| 6-agent orchestration | Auto-routing, SLA deadlines, dedup, priority — no manual desk |
| Public accountability | Named status timeline shareable on WhatsApp |
| Predictive hotspots | Shift from reactive complaints to preventive maintenance |

**Speaker notes:** “Same engineering rigor as enterprise logistics — mission is communities, not cargo.”

---

## Slide 05 — Features (8 official)

**Title:** Eight features — production on Cloud Run

1. **3-step report wizard** — Photo capture, GPS pin, Gemini Vision prefill
2. **Google Maps explorer** — Marker clusters + list fallback for low-bandwidth
3. **Issue detail & timeline** — Status history, department, SLA countdown
4. **Community upvote verification** — Tiers at 1 / 3 / 10 votes → Community Verified
5. **6-agent pipeline** — Vision, routing, SLA, dedup, priority, gamification
6. **Admin panel** — Status updates, proof photo, resolution workflow
7. **Impact dashboard** — Recharts summary, hotspots, trend insights, Open311 export
8. **Civic assistant** — Gemini chat with tool calling over live issue data

**Speaker notes:** Point to live URL; don’t read every bullet — pick 3 for depth.

---

## Slide 06 — Process flow

**Title:** Citizen journey — photo to resolution

```
Photo + GPS → Gemini classify → Firestore issue → Map pin
     → Neighbors upvote → Community Verified → Department assigned
     → In Progress → Resolved + proof photo → Points + badge
```

**Diagram:** Embed `docs/diagrams/png/02-user-journey.png` or `05-report-intake-sequence.png` when rendered.

**Speaker notes:** Walk the happy path in 45 seconds before opening the app.

---

## Slide 07 — Wireframes / screenshots

**Title:** Civic Glass UI — mobile-first

**Screens to capture from production:**
1. Landing (`/`) — hero, sign-in CTA
2. Report wizard (`/report`) — step 2 AI analysis card
3. Map explorer (`/map`) — clustered markers
4. Issue detail (`/issues/:id`) — timeline + upvote
5. Dashboard (`/dashboard`) — charts + hotspot card
6. Leaderboard (`/leaderboard`) — civic points

**Design:** Dark map-first, teal accent `#14B8A6` — see `.stitch/DESIGN.md`

**Speaker notes:** Use phone mockup frames; one screenshot per feature area.

---

## Slide 08 — Architecture

**Title:** System architecture

**Diagram:** Embed `docs/diagrams/png/01-system-architecture.png`

**Layers:**
- **Client:** React 19 PWA, Firebase Auth SDK, Google Maps JS
- **Cloud Run:** Express API + static SPA, agent pipeline
- **Firebase:** Firestore, Cloud Storage, Auth
- **AI:** Gemini 2.0 Flash / Flash Lite

**Speaker notes:** Single container deploy — API and frontend share one Cloud Run service.

---

## Slide 09 — Agent workflow

**Title:** 6-agent orchestration

**Diagram:** Embed `docs/diagrams/png/04-agent-workflow.png`

**Agents:** Intake → Vision → Routing → SLA → Dedup → Priority  
**Branches:** Low confidence → Draft review queue; duplicates → merge suggestions

**Speaker notes:** Emphasize conditional edges — this is agentic, not a single prompt.

---

## Slide 10 — Technology stack

**Title:** Stack

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

---

## Slide 11 — Google technologies

**Title:** Built on Google Cloud & AI

- **Google AI Studio** — prototype → export → Cloud Run publish path
- **Gemini 2.0 Flash** — vision classification, dashboard insights, civic assistant
- **Firebase Auth** — Google Sign-In, ID tokens for API
- **Cloud Firestore** — realtime issue data, geohash queries
- **Cloud Storage** — report and proof images
- **Google Maps Platform** — map tiles + server reverse geocoding
- **Cloud Run** — production HTTPS hosting

**Speaker notes:** Tie each Google product to a visible feature on the demo.

---

## Slide 12 — Live demo

**Title:** 3-minute demo script

**QR code:** https://community-hero-987477089222.asia-south1.run.app

| Minute | Action |
|--------|--------|
| 0:00 | Landing → Sign in with Google |
| 0:30 | Map → filter potholes → open seeded issue |
| 1:00 | Issue detail → upvote → show verification tier |
| 1:30 | Report wizard → photo → AI analyze → submit (or show pre-seeded) |
| 2:00 | Dashboard → summary charts + hotspot |
| 2:30 | Assistant → “What potholes are open near me?” |
| 2:45 | Admin → mark In Progress (if admin account) |

**Backup:** Vercel preview https://community-hero-eight.vercel.app

**Speaker notes:** Rehearse twice on production with seed data; keep incognito tab ready.

---

## Slide 13 — Impact metrics

**Title:** Measurable impact (demo + design targets)

| Metric | Target / claim |
|--------|----------------|
| Triage time | **80% faster** vs manual municipal forms |
| Duplicate reduction | **~40%** via geohash dedup + community verify |
| AI classification | **90%+** accuracy on demo ward set |
| API latency | Sub-**3s** vision analyze; **&lt;5s** full submit P95 |
| Transparency | 100% issues have public status timeline |
| Engagement | Gamification — points, badges, opt-in leaderboard |

**Speaker notes:** Cite InfraGuard / Swachhata benchmarks as industry context; our numbers are from seeded demo + architecture design.

---

## Slide 14 — Links

**Title:** Submission links

| Item | URL |
|------|-----|
| **Deployed app** | https://community-hero-987477089222.asia-south1.run.app |
| **GitHub** | https://github.com/Ojas-Srivastava05/community-hero |
| **Vercel preview** | https://community-hero-eight.vercel.app |
| **Google Doc** | _(add public view link before submit)_ |
| **BlockseBlock** | _(dashboard project URL after final submit)_ |

**Speaker notes:** Open all three mandatory links in incognito before BlockseBlock final submit.

---

## Slide 15 — Closing

**Title:** Every pothole deserves a public record and a named resolution.

**Content:**
- Community Hero turns citizen photos into accountable, routed, verifiable civic records
- AI + agents + community = faster fixes and public trust
- Open source on GitHub; live on Cloud Run today
- Thank you — questions?

**Contact:** Team placeholder — add emails on final slide

---

## Export checklist

- [ ] All 15 slides built with screenshots from production URL
- [ ] Architecture + agent workflow PNGs embedded (slides 08–09)
- [ ] QR code on slide 12 points to Cloud Run URL
- [ ] Team names updated (slide 02)
- [ ] Google Doc link added (slide 14) before BlockseBlock submit
- [ ] PDF export uploaded to Google Drive as backup
