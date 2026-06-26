# Submission Checklist — Phase 18 (BlockseBlock)

Mandatory deliverables for **Vibe to Ship / BlockseBlock 2026**.  
**Deadline: June 29, 2026, 2:00 PM**

Use this checklist after Phases 16–17 (deploy + seed + QA) are green.

---

## Live URLs (from README)

| Item | URL | Status |
|------|-----|--------|
| **Deployed app (primary)** | https://community-hero-987477089222.asia-south1.run.app | ☐ Tested incognito |
| Vercel preview | https://community-hero-eight.vercel.app | ☐ Optional backup |
| GitHub repository | https://github.com/Ojas-Srivastava05/community-hero | ☐ Public, README polished |
| Google Doc | _(create — anyone with link can view)_ | ☐ All 10 Appendix J sections |
| BlockseBlock project | _(dashboard after Create Project)_ | ☐ Final Submit clicked |

---

## Pre-submit verification

Run automated phase checks against production:

```bash
bash scripts/verify-phases.sh
# or explicit URL:
bash scripts/verify-phases.sh https://community-hero-987477089222.asia-south1.run.app
```

Manual smoke (incognito, no prior login):

- [ ] `GET /api/health` → `status: ok`, `firestore: connected`
- [ ] Landing `/` loads; Google Sign-In works on production domain
- [ ] Map `/map` shows seeded issues
- [ ] Report wizard `/report` — camera/GPS on HTTPS
- [ ] Dashboard `/dashboard` — analytics charts
- [ ] Privacy `/privacy` and admin analytics `/admin/analytics` load
- [ ] `GET /api/analytics/trends` returns 200
- [ ] `GET /api/departments` returns 200
- [ ] Submit one test report end-to-end (or use seeded data for demo)

Firebase console (see `TODO.md`):

- [ ] Auth authorized domain: `community-hero-987477089222.asia-south1.run.app`
- [ ] Firebase Storage enabled for image uploads
- [ ] `GEMINI_API_KEY` on Cloud Run (optional — fallbacks work)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` baked in build for live tiles

---

## GitHub final polish

- [ ] README: live URL, architecture diagram, features, stack, team
- [ ] `docs/` complete — `docs/README.md` indexes all documents
- [ ] Tag release: `v1.0.0-submission`
- [ ] GitHub Actions CI green on `main`
- [ ] No secrets committed (`.env` gitignored)

---

## Google Doc (Appendix J — 10 sections)

Public link required for BlockseBlock. Suggested outline:

1. **Problem Statement Selected** — Community Hero (Vibe2Ship PS2)
2. **Solution Overview** — ~300 words on CIVICPULSE AI
3. **Key Features** — all 8 official features with production screenshots
4. **Technologies Used** — full stack table
5. **Google Technologies Utilized** — AI Studio, Gemini, Firebase, Cloud Run, Maps
6. **Architecture** — embed `01-system-architecture.png`
7. **Agent Workflow** — embed `04-agent-workflow.png`
8. **Live URL + GitHub URL** — links from table above
9. **Team members and roles** — see `docs/ppt-info/SUBMISSION.md` slide 02
10. **Future roadmap** — ADK, Open311 integrations, multilingual voice

Evaluation mapping (Appendix A): explicitly address innovation, technical depth, impact, and completeness in sections 2–3 and 13 metrics.

---

## Presentation (Appendix P — 15 slides)

- [ ] Build slides from `docs/ppt-info/SUBMISSION.md`
- [ ] Embed architecture + agent workflow PNGs
- [ ] QR code to Cloud Run URL on demo slide
- [ ] Rehearse 3-minute demo twice on production (Appendix I)

---

## BlockseBlock platform steps

1. Log in to **BlockseBlock** dashboard
2. **Create Project** → select **Community Hero** problem statement
3. Enter **Deployed Application Link:**  
   `https://community-hero-987477089222.asia-south1.run.app`
4. Enter **GitHub Repository Link:**  
   `https://github.com/Ojas-Srivastava05/community-hero`
5. Enter **Google Doc Link** (anyone with link can view)
6. Review all fields — **Final Submit is irreversible**
7. Toggle confirmation notes → **Final Submit**
8. Verify dashboard shows **submitted** status
9. Screenshot confirmation for team records

---

## Post-submit (Phase 19)

- [ ] Monitor `GET /api/health` during evaluation (UptimeRobot or cron)
- [ ] Do **not** delete AI Studio app until evaluation ends
- [ ] Keep Cloud Run service running; avoid breaking deploys
- [ ] Judge demo rehearsed with seeded ward data (`DEMO_WARD_001`)

---

## Quick reference

| Document | Path |
|----------|------|
| API contract | `docs/api_contract.md` |
| Architecture | `docs/architecture.md` |
| Deployment runbook | `docs/deployment.md` |
| Presentation outline | `docs/ppt-info/SUBMISSION.md` |
| Master plan | `Community-Hero-Master-Plan.pdf` |
| Phase plan | `Community-Hero-Phase-Development-Plan.pdf` |
| Manual TODO | `TODO.md` |

**Project:** `community-hero-vibe2ship` · **Region:** `asia-south1` · **Service:** `community-hero`
