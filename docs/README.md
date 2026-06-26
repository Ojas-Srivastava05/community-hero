# Community Hero — Documentation Index

Central index for the `docs/` folder. Mirrors LogiFlow-style documentation layout for Vibe2Ship Phase 15.

**Product:** CIVICPULSE AI (Community Hero)  
**Hackathon:** Vibe to Ship / BlockseBlock 2026 — Problem Statement 2  
**Production:** https://community-hero-987477089222.asia-south1.run.app

---

## Core documents

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | System layout, routes, agent pipeline, Firestore model, deployment summary |
| [system-design.md](system-design.md) | Data model overview, auth, API pointer |
| [api_contract.md](api_contract.md) | Full REST API reference — every endpoint, auth, rate limits |
| [deployment.md](deployment.md) | GCP/Firebase project, env vars, deploy script, CI, BlockseBlock notes |
| [SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md) | Phase 18 BlockseBlock steps with live URLs |

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
| 04 | [04-agent-workflow.mmd](diagrams/mermaid/04-agent-workflow.mmd) | 6 agents with confidence gate and dedup branch |
| 05 | [05-report-intake-sequence.mmd](diagrams/mermaid/05-report-intake-sequence.mmd) | Report submission API sequence with latency notes |
| 08 | [08-firestore-schema.mmd](diagrams/mermaid/08-firestore-schema.mmd) | Collections, subcollections, relationships |
| 12 | [12-deployment-topology.mmd](diagrams/mermaid/12-deployment-topology.mmd) | Cloud Run, Firebase, CI/CD, Google APIs |

> Full Section 32 set is 16 diagrams (`01`–`16`). Remaining diagrams to add per master plan: `02-user-journey`, `03-vision-pipeline`, `06-firestore-erd`, `07-authentication-flow`, `09-deployment-infrastructure`, `10-security-rate-limiting`, `11-map-clustering`, `13-gamification-flow`, `14-predictive-insights`, `15-open311-export`, `16-judge-demo-flow`.

---

## Presentation & submission

| Document | Description |
|----------|-------------|
| [ppt-info/SUBMISSION.md](ppt-info/SUBMISSION.md) | Appendix P — 15-slide jury outline with Community Hero content |

---

## Repository references (outside `docs/`)

| Resource | Path |
|----------|------|
| Root README | [`../README.md`](../README.md) — features, URLs, local dev |
| Build TODO | [`../TODO.md`](../TODO.md) — manual Firebase + BlockseBlock steps |
| Master plan PDF | [`../Community-Hero-Master-Plan.pdf`](../Community-Hero-Master-Plan.pdf) |
| Phase development plan | [`../Community-Hero-Phase-Development-Plan.pdf`](../Community-Hero-Phase-Development-Plan.pdf) |
| Design system | [`../.stitch/DESIGN.md`](../.stitch/DESIGN.md) — Civic Glass UI |
| Shared types | [`../shared/types.ts`](../shared/types.ts) |
| Phase verification | [`../scripts/verify-phases.sh`](../scripts/verify-phases.sh) |
| Deploy script | [`../scripts/deploy-cloud-run.sh`](../scripts/deploy-cloud-run.sh) |

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
| 18 | SUBMISSION-CHECKLIST.md, ppt-info/SUBMISSION.md |
