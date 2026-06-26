# Phase 0 — Foundation, Requirements & Quality Bar

**Status:** Complete  
**Codename:** CIVICPULSE AI  
**Product:** Community Hero — Hyperlocal Problem Solver (Vibe2Ship Problem Statement 2)  
**Deadline:** **June 29, 2026, 2:00 PM** — BlockseBlock final submission (irreversible)

---

## Product vision

Community Hero is a hyperlocal civic intelligence platform that enables citizens to identify, report, validate, track, and resolve community infrastructure issues through AI automation, geospatial data, and transparent community participation. Residents photograph potholes, leaks, broken streetlights, or waste; Gemini vision triages in under three seconds; neighbors upvote to verify; six autonomous agents route issues to departments with SLA deadlines; and public dashboards show accountability from report to resolution. The strategic thesis is to win the hackathon by combining sub-3-second Gemini vision triage, deterministic agent workflows for routing and deduplication, public accountability dashboards, and one-click AI Studio deployment with a parallel GitHub repo for jury verification.

---

## Official 8 hackathon features → build phases

| # | Official feature (Section 2.3) | Primary phase | Also covered |
|---|--------------------------------|---------------|--------------|
| 1 | Image and video-based issue reporting | **Phase 2** | Phase 14 UI polish |
| 2 | AI-powered issue categorization | **Phase 2** | Phase 6 Agent 2 (Vision) |
| 3 | Geo-location and mapping | **Phase 3** | Phase 4 geo fields |
| 4 | Community verification | **Phase 5** | Phase 10 gamification points |
| 5 | Real-time issue tracking | **Phase 4, 7** | Phase 6 notify agent |
| 6 | Impact dashboards | **Phase 8** | Phase 9 insights |
| 7 | Predictive insights | **Phase 9** | Phase 6 Agent 6 (Insights) |
| 8 | Gamification for citizen engagement | **Phase 10** | Phase 14 leaderboard UI |

---

## Evaluation weights (Appendix A)

Design every feature to score on the criteria below. Top three criteria are **20% each** — prioritize agentic depth, measurable impact, and innovation.

| Criteria | Weight | Community Hero strategy |
|----------|--------|-------------------------|
| Problem Solving & Impact | **20%** | Transparent civic reporting; measurable triage speed; public accountability; community verification reducing duplicate noise |
| Agentic Depth | **20%** | 6-agent workflow: triage, vision, dedup, route, notify, insights — not a single-prompt chatbot |
| Innovation & Creativity | **20%** | AI vision + geo hotspots + ethical gamification + thread clustering (CivicThreads pattern) |
| Google Technologies | **15%** | AI Studio, Gemini 2.5 Flash, Cloud Run, Firestore, Auth, Storage, Maps |
| Product Experience | **10%** | Mobile PWA, 3-tap report, realtime map, clear status timeline |
| Technical Implementation | **10%** | Structured JSON, security rules, server-side secrets, geohash indexes |
| Completeness & Usability | **5%** | Full report → verify → resolve demo path with live deployment |

**Memorize:** Impact 20%, Agentic 20%, Innovation 20%, Google Tech 15%.

---

## Differentiation vs Swachhata & FixMyStreet

### Three competitor apps

| App | Origin | Strength | Gap we exploit |
|-----|--------|----------|----------------|
| **Swachhata-MoHUA** | Janaagraha, 4041+ cities | Photo + GPS + upvote + resolved proof | No deep agentic AI, no predictive hotspots, no sub-3s vision triage |
| **FixMyStreet** | mySociety (global benchmark) | Map-pin reporting, authority routing, Open311 | No AI vision classify, no gamification, no AI Studio deploy path |
| **InfraGuard** | DevPost / GitHub AI-native | Gemini vision, ~3s analysis, hotspot analytics | Partial agentic workflow; no Swachhata-grade community verification tiers |

### Three differentiators (CIVICPULSE AI)

1. **Agentic AI** — Six deterministic agents (intake, vision, dedup, routing, notify, insights) with function-calling civic assistant; Swachhata relies on manual municipal triage.
2. **Predictive hotspots** — Geohash-6 density scoring + Gemini trend narratives; neither Swachhata nor FixMyStreet offers preventive maintenance zone suggestions.
3. **Sub-3s vision triage** — Gemini 2.5 Flash structured JSON on every photo; InfraGuard-grade speed with Swachhata-grade community participation and public resolution timelines.

See [COMPETITIVE-MATRIX.md](COMPETITIVE-MATRIX.md) for the full Appendix F table.

---

## LogiFlow quality bar (Section 19)

Reference benchmark: LogiFlow-Solution-Challenge-2026 (771 commits, 6,275+ doc lines, 16 diagrams).

| Target | LogiFlow | Community Hero |
|--------|----------|----------------|
| Documentation | 6,275+ lines | 8,000+ lines stretch |
| Diagrams | 16 mermaid + PNG | 16 civic-specific (5/16 in repo) |
| Pipelines | 5 transport modes | 9 civic pipelines |
| Deploy | Vercel + Cloud Run | AI Studio Publish + Cloud Run |

Parity checklist: `docs/` folder, `api_contract.md`, `architecture.md`, `Makefile`, `.github/workflows`, `TODO.md`, seed scripts.

---

## Team alignment

Roles assigned per [TEAM-ROLES.md](TEAM-ROLES.md). Tech Lead: **Ojas**.

---

## Reference repositories (Section 17)

Bookmark for patterns — do not fork wholesale:

- [FixMyStreet](https://github.com/mysociety/fixmystreet) — UX patterns
- [InfraGuard](https://github.com/ABHIJATSARARI/InfraGuard) — Gemini vision pipeline
- [CivicThreads](https://github.com/Mustafa-Adnan-Official/CivicThreads) — thread clustering
- [PotSoft](https://github.com/TahPapeJe/PotSoft) — pothole detection
- [Open311 GeoReport v2](https://wiki.open311.org/GeoReport_v2/) — municipal export

---

## Submission requirements (Section 14)

Three mandatory links for BlockseBlock:

1. **Deployed Application** — Cloud Run HTTPS URL (must stay live through evaluation)
2. **GitHub Repository** — full source + README + `docs/`
3. **Google Doc** — public link; all 8 features + evaluation criteria mapped

---

## Phase 0 definition of done

- [x] Problem statement confirmed: Community Hero — Hyperlocal Problem Solver
- [x] Product vision documented (this file + [PRODUCT-VISION.md](PRODUCT-VISION.md))
- [x] All 8 features mapped to phases 2–12
- [x] Evaluation criteria understood; design targets Agentic Depth 20%
- [x] Competitive matrix and team roles committed to repo
- [x] Deadline set: June 29, 2026, 2:00 PM

## Phase 0 verification (self-check)

- [x] Can explain product in 30 seconds — see [PRODUCT-VISION.md](PRODUCT-VISION.md)
- [x] Can name 3 competitors and 3 differentiators — see above
- [x] Deadline and submission requirements understood — see above

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PRODUCT-VISION.md](PRODUCT-VISION.md) | 30-second pitch script |
| [COMPETITIVE-MATRIX.md](COMPETITIVE-MATRIX.md) | Appendix F feature comparison |
| [TEAM-ROLES.md](TEAM-ROLES.md) | Appendix U role assignments |
| [Community-Hero-Master-Plan.pdf](../Community-Hero-Master-Plan.pdf) | Full 61-page specification |
| [Community-Hero-Phase-Development-Plan.pdf](../Community-Hero-Phase-Development-Plan.pdf) | Phase 0–19 tracker |
