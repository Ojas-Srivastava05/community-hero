# Community Hero — Documentation Index

Central index for the `docs/` folder. Mirrors LogiFlow-style documentation layout for Vibe2Ship Phase 15.

**Product:** CIVICPULSE AI (Community Hero)  
**Hackathon:** Vibe to Ship / BlockseBlock 2026 — Problem Statement 2  
**Production:** https://community-hero-987477089222.asia-south1.run.app

---

## Phase 0–1 (foundation & scaffold)

| Document | Description |
|----------|-------------|
| [PHASE-0-FOUNDATION.md](PHASE-0-FOUNDATION.md) | Product vision, 8 features → phases, evaluation weights, differentiation |
| [PRODUCT-VISION.md](PRODUCT-VISION.md) | 30-second pitch script |
| [COMPETITIVE-MATRIX.md](COMPETITIVE-MATRIX.md) | Appendix F — vs Swachhata, FixMyStreet, InfraGuard |
| [TEAM-ROLES.md](TEAM-ROLES.md) | Appendix U — role assignments (Ojas = Tech Lead) |
| [pipelines/README.md](pipelines/README.md) | Nine civic pipelines index (Section 23) |

## Core documents

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | System layout, routes, agent pipeline, Firestore model, deployment summary |
| [system-design.md](system-design.md) | Sections 20, 25, 29 — design principles, L1–L5 caching, ML models A–G (424 lines) |
| [api_contract.md](api_contract.md) | Full REST API reference — every endpoint, auth, rate limits |
| [deployment.md](deployment.md) | GCP/Firebase project, env vars, deploy script, CI, BlockseBlock notes |
| [SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md) | Phase 18 BlockseBlock steps with evidence links |
| [PHASE-COMPLETION-TRACKER.md](PHASE-COMPLETION-TRACKER.md) | Phases 0–19 at 100% with evidence paths |
| [PHASE-0-FOUNDATION.md](PHASE-0-FOUNDATION.md) | Evaluation matrix, competitive positioning |
| [TEAM-ROLES.md](TEAM-ROLES.md) | Appendix U team assignments |
| [COMPETITIVE-MATRIX.md](COMPETITIVE-MATRIX.md) | Appendix F feature comparison |

---

## Diagrams

Mermaid sources in [`diagrams/mermaid/`](diagrams/mermaid/). Render to PNG with:

```bash
npx @mermaid-js/mermaid-cli -i docs/diagrams/mermaid/ -o docs/diagrams/png/
# or: make diagrams (when render-diagrams.sh is present)
```

| # | File | Section 32 spec |
|---|------|-----------------|
| 01 | [01-system-architecture.mmd](diagrams/mermaid/01-system-architecture.mmd) | PWA, Cloud Run, Agents, Gemini, Firestore, Storage, Maps |
| 02 | [02-user-journey.mmd](diagrams/mermaid/02-user-journey.mmd) | Citizen photo → map → verify → resolved |
| 03 | [03-report-wizard-flow.mmd](diagrams/mermaid/03-report-wizard-flow.mmd) | 3-step report wizard UI |
| 04 | [04-agent-workflow.mmd](diagrams/mermaid/04-agent-workflow.mmd) | 6 agents with confidence gate and dedup branch |
| 05 | [05-report-intake.mmd](diagrams/mermaid/05-report-intake.mmd) | Report submission API sequence with latency notes |
| 06 | [06-upvote-verification.mmd](diagrams/mermaid/06-upvote-verification.mmd) | Community verification tiers |
| 07 | [07-admin-resolution.mmd](diagrams/mermaid/07-admin-resolution.mmd) | Admin status + proof workflow |
| 08 | [08-firestore-schema.mmd](diagrams/mermaid/08-firestore-schema.mmd) | Collections, subcollections, relationships |
| 09 | [09-gamification-flow.mmd](diagrams/mermaid/09-gamification-flow.mmd) | Points, badges, leaderboard |
| 10 | [10-ai-assistant-tools.mmd](diagrams/mermaid/10-ai-assistant-tools.mmd) | Civic assistant function calling |
| 11 | [11-open311-export.mmd](diagrams/mermaid/11-open311-export.mmd) | Open311 GeoReport v2 mapping |
| 12 | [12-deployment.mmd](diagrams/mermaid/12-deployment.mmd) | Cloud Run, Firebase, CI/CD |
| 13 | [13-analytics-pipeline.mmd](diagrams/mermaid/13-analytics-pipeline.mmd) | Dashboard analytics data flow |
| 14 | [14-security-layers.mmd](diagrams/mermaid/14-security-layers.mmd) | 7 security & rate-limit layers |
| 15 | [15-mobile-pwa-architecture.mmd](diagrams/mermaid/15-mobile-pwa-architecture.mmd) | Mobile PWA + device APIs |
| 16 | [16-evaluation-alignment.mmd](diagrams/mermaid/16-evaluation-alignment.mmd) | Hackathon evaluation criteria map |

Full index: [diagrams/README.md](diagrams/README.md). PNG exports in [`diagrams/png/`](diagrams/png/).

---

## Presentation & submission (Phases 18–19)

| Document | Description |
|----------|-------------|
| [submission/GOOGLE-DOC-CONTENT.md](submission/GOOGLE-DOC-CONTENT.md) | Appendix J — full 10-section Google Doc (paste-ready) |
| [submission/screenshots/README.md](submission/screenshots/README.md) | 8 screenshot capture paths for Google Doc |
| [ppt-info/SLIDES-COMPLETE.md](ppt-info/SLIDES-COMPLETE.md) | Appendix P — 15 slides with full speaker notes |
| [ppt-info/SUBMISSION.md](ppt-info/SUBMISSION.md) | Appendix P — slide outline (compact) |
| [ppt-info/slides/](ppt-info/slides/) | 15 individual slide markdown files (01–15) |
| [demo/APPENDIX-I-DEMO-SCRIPT.md](demo/APPENDIX-I-DEMO-SCRIPT.md) | Appendix I — 3-minute timed demo with click paths |
| [demo/REHEARSAL-CHECKLIST.md](demo/REHEARSAL-CHECKLIST.md) | Twice-timed rehearsal + backup video steps |
| [demo/QR-CODE.md](demo/QR-CODE.md) | Production URL QR for jury slide |
| [presentation/COMMUNITY-HERO-COMPLETE-GUIDE.md](presentation/COMMUNITY-HERO-COMPLETE-GUIDE.md) | End-to-end presentation walkthrough |

---

## Repository references (outside `docs/`)

| Resource | Path |
|----------|------|
| Root README | [`../README.md`](../README.md) — features, URLs, local dev |
| Build TODO | [`TODO.md`](TODO.md) — manual Firebase + BlockseBlock steps |
| Master plan PDF | [`planning/Community-Hero-Master-Plan.pdf`](planning/Community-Hero-Master-Plan.pdf) |
| Phase development plan | [`planning/Community-Hero-Phase-Development-Plan.pdf`](planning/Community-Hero-Phase-Development-Plan.pdf) |
| Hackathon guidelines | [`planning/vibe2ship-submission-guidelines.pdf`](planning/vibe2ship-submission-guidelines.pdf) |
| Reference decks | [`reference/presentations/`](reference/presentations/) |
| Design system | [`../.stitch/DESIGN.md`](../.stitch/DESIGN.md) — Civic Glass UI |
| Shared types | [`../shared/types.ts`](../shared/types.ts) |
| Phase verification | [`../scripts/verify-phases.sh`](../scripts/verify-phases.sh) |
| Submission prep | [`../scripts/prepare-submission.sh`](../scripts/prepare-submission.sh) |
| Deploy script | [`../scripts/deploy-cloud-run.sh`](../scripts/deploy-cloud-run.sh) |
| Changelog | [`CHANGELOG.md`](CHANGELOG.md) |

---

## External links

| Item | URL |
|------|-----|
| Cloud Run (production) | https://community-hero-987477089222.asia-south1.run.app |
| Vercel preview | https://community-hero-eight.vercel.app |
| GitHub | https://github.com/Ojas-Srivastava05/community-hero |

---

## Phase coverage map

| Phase | Primary docs |
|-------|----------------|
| 15 | This index, architecture, diagrams, api_contract |
| 16 | deployment.md, README URLs |
| 17 | verify-phases.sh, seed scripts |
| 18 | submission/GOOGLE-DOC-CONTENT.md, SUBMISSION-CHECKLIST.md, prepare-submission.sh |
| 19 | demo/APPENDIX-I-DEMO-SCRIPT.md, PHASE-COMPLETION-TRACKER.md |
