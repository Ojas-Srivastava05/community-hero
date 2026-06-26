# Team Role Assignments (Appendix U)

Confirmed team ownership for the Vibe2Ship 7-day sprint.

**Project:** Community Hero (CIVICPULSE AI)  
**Repository:** [github.com/Ojas-Srivastava05/community-hero](https://github.com/Ojas-Srivastava05/community-hero)  
**Deadline:** June 29, 2026, 2:00 PM — BlockseBlock

---

## Role matrix

| Role | Owner | Focus areas | Key deliverables |
|------|-------|-------------|------------------|
| **Tech Lead / Full-stack** | **Ojas** | Architecture, AI Studio, Cloud Run, GitHub, documentation | `docs/`, `Makefile`, deploy runbook, phase tracker, API contract review |
| **AI / Agent Engineer** | **Priya Sharma** | Gemini prompts, 6-agent workflow, embeddings, chat tools | `server/src/lib/agents.ts`, `gemini.ts`, vision schema, function-calling tools |
| **Frontend / UX** | **Arjun Mehta** | PWA, map, report wizard, dashboard, mobile QA | `frontend/src/pages/`, Civic Glass design system, 18 routes, accessibility |
| **Data / Geo** | **Kavya Reddy** | Firestore schema, geohash, ward boundaries, seed data | `firestore.rules`, indexes, `scripts/seed-*.ts`, geo pipeline |
| **DevOps / Submission** | **Rohan Das** | Deploy, health checks, BlockseBlock, Google Doc | Cloud Run env vars, CI/CD, UptimeRobot, submission links |

---

## Phase ownership map

| Phase | Title | Primary owner |
|-------|-------|---------------|
| 0 | Foundation | Tech Lead |
| 1 | Scaffold & GCP | Tech Lead + DevOps |
| 2 | Report + Vision AI | AI Engineer + Frontend |
| 3 | Maps & Geo | Frontend + Data/Geo |
| 4 | Firestore realtime | Data/Geo + Full-stack |
| 5 | Community verify | Full-stack |
| 6 | 6 agents | AI Engineer |
| 7 | Admin & SLA | Full-stack |
| 8–9 | Dashboards + insights | Frontend + AI Engineer |
| 10 | Gamification | Full-stack |
| 11 | AI chat | AI Engineer |
| 12 | Threads + Open311 | Data/Geo |
| 13 | Security & perf | DevOps + Tech Lead |
| 14 | Frontend polish | Frontend |
| 15 | Docs & diagrams | Tech Lead |
| 16 | Deploy & CI/CD | DevOps |
| 17 | Testing & seed | All |
| 18 | Submission package | DevOps + Tech Lead |
| 19 | Demo & closure | All |

---

## Communication norms

- **Daily sync:** 15 min — blockers, phase checkbox status, deploy URL health.
- **Source of truth:** `Community-Hero-Phase-Development-Plan.pdf` checkboxes + `TODO.md`.
- **No secrets in chat:** Use AI Studio Secrets panel and Cloud Run env — never commit `.env`.
- **PR policy:** Small focused commits; conventional commit messages (`feat:`, `fix:`, `docs:`).

---

## Submission responsibilities (Phase 18)

| Deliverable | Owner |
|-------------|-------|
| GitHub repo polish + `v1.0.0-submission` tag | Tech Lead |
| Google Doc (Appendix J template) | DevOps + Tech Lead |
| 15-slide deck (Appendix P) | Frontend + Tech Lead |
| BlockseBlock final submit | DevOps |
| Live URL stays up through evaluation | DevOps |

---

## Contact

| Role | Contact |
|------|---------|
| Tech Lead | Ojas — primary repo maintainer |
| AI / Agent Engineer | Priya Sharma |
| Frontend / UX | Arjun Mehta |
| Data / Geo | Kavya Reddy |
| DevOps / Submission | Rohan Das |
| Team contact | community-hero@vibe2ship.dev |
