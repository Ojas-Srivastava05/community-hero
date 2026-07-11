# Submission Checklist — Phase 18 (BlockseBlock)

Mandatory deliverables for **Vibe to Ship / BlockseBlock 2026**.  
**Deadline: June 29, 2026, 2:00 PM**

All in-repo items are complete. Manual steps require Google Docs UI and BlockseBlock dashboard.

---

## Live URLs

| Item | URL | Status | Evidence |
|------|-----|--------|----------|
| **Deployed app (primary)** | https://community-hero-987477089222.asia-south1.run.app | ✅ Tested | `bash scripts/verify-phases.sh` — Phase 18 **9/9** in-repo (see § Phase 18 verification below); health 200 |
| Vercel preview | https://community-hero-eight.vercel.app | ✅ Optional backup | Listed in [`README.md`](../README.md) |
| GitHub repository | https://github.com/Ojas-Srivastava05/community-hero | ✅ Public, README polished | [`README.md`](../README.md), architecture + features table |
| Google Doc | _(create — anyone with link can view)_ | ⏳ **Manual** | Content ready: [`submission/GOOGLE-DOC-CONTENT.md`](submission/GOOGLE-DOC-CONTENT.md) |
| BlockseBlock project | _(dashboard after Create Project)_ | ⏳ **Manual** | URLs printed by `bash scripts/prepare-submission.sh` |

---

## Pre-submit verification

Run automated phase checks against production:

```bash
bash scripts/verify-phases.sh
# or explicit URL:
bash scripts/verify-phases.sh https://community-hero-987477089222.asia-south1.run.app
```

| Check | Status | Evidence |
|-------|--------|----------|
| `GET /api/health` → `status: ok`, `firestore: connected` | ✅ | `scripts/verify-phases.sh` Phase 1 |
| Landing `/` loads | ✅ | Phase 3 route check |
| Google Sign-In on production domain | ✅ | Google provider enabled via `firebase deploy --only auth`; authorized domain already listed |
| Map `/map` shows issues | ✅ | Phase 3; seed via `make seed` if sparse |
| Report wizard `/report` — camera/GPS on HTTPS | ✅ | Route 200; wizard in `frontend/src/pages/ReportPage.tsx` |
| Dashboard `/dashboard` — analytics charts | ✅ | Phase 8 |
| Privacy `/privacy` and admin analytics `/admin/analytics` | ✅ | Phase 14 |
| `GET /api/analytics/trends` returns 200 | ✅ | Phase 8 |
| `GET /api/departments` returns 200 | ✅ | Phase 8 |
| End-to-end test report or seeded demo data | ✅ | `server/scripts/seed-firestore.ts`, Phase 17 |

Firebase console (see [`TODO.md`](TODO.md)):

| Item | Status | Notes |
|------|--------|-------|
| Auth authorized domain: `community-hero-987477089222.asia-south1.run.app` | ✅ | Already in Firebase Auth config |
| Firebase Storage enabled | ⚠️ **Partial** | GCS bucket `community-hero-vibe2ship-uploads` works for uploads; Firebase Storage *console product* needs one-time “Get Started” click for rules deploy |
| `GEMINI_API_KEY` on Cloud Run | ✅ | Set on revision `community-hero-00020-dtk` (see `.env.local`) |
| `VITE_GOOGLE_MAPS_API_KEY` at build time | ✅ | Injected via Cloud Build / `frontend/.env.production` |

---

## GitHub final polish

| Item | Status | Evidence |
|------|--------|----------|
| README: live URL, architecture diagram, features, stack, team | ✅ | [`README.md`](../README.md) |
| `docs/` complete — `docs/README.md` indexes all documents | ✅ | [`README.md`](README.md) |
| Tag release: `v1.0.0-submission` | ✅ Tagged locally | `bash scripts/prepare-submission.sh` (push: `git push origin v1.0.0-submission`) |
| GitHub Actions CI green on `main` | ✅ | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| No secrets committed (`.env` gitignored) | ✅ | `.env.example` only; `.gitignore` |

---

## Google Doc (Appendix J — 10 sections)

| Section | Status | Evidence |
|---------|--------|----------|
| 1. Problem Statement Selected | ✅ Written | [`submission/GOOGLE-DOC-CONTENT.md`](submission/GOOGLE-DOC-CONTENT.md) §1 |
| 2. Solution Overview (~300 words) + evaluation mapping | ✅ Written | Same file §2 + Appendix A table |
| 3. Key Features — all 8 with screenshot placeholders | ✅ Written | Same file §3 |
| 4. Technologies Used | ✅ Written | Same file §4 |
| 5. Google Technologies Utilized | ✅ Written | Same file §5 |
| 6. Architecture diagram embed | ✅ Written | Same file §6 + `diagrams/mermaid/01-system-architecture.mmd` |
| 7. Agent workflow diagram embed | ✅ Written | Same file §7 + `diagrams/mermaid/04-agent-workflow.mmd` |
| 8. Live URL + GitHub URL | ✅ Written | Same file §8 |
| 9. Team members and roles | ✅ Written | Same file §9 + [`TEAM-ROLES.md`](TEAM-ROLES.md) |
| 10. Future roadmap | ✅ Written | Same file §10 |
| **Publish public link** | ⏳ **Manual** | Paste into Google Docs → Share → Anyone with link |

Evaluation mapping (Appendix A): innovation, agentic depth, impact, Google tech, and completeness addressed in §2–3 and [`PHASE-0-FOUNDATION.md`](PHASE-0-FOUNDATION.md).

---

## Presentation (Appendix P — 15 slides)

| Item | Status | Evidence |
|------|--------|----------|
| 15 slides with full speaker notes | ✅ | [`ppt-info/SLIDES-COMPLETE.md`](ppt-info/SLIDES-COMPLETE.md) |
| Outline reference | ✅ | [`ppt-info/SUBMISSION.md`](ppt-info/SUBMISSION.md) |
| Architecture + agent workflow PNGs | ✅ | `docs/diagrams/png/01-system-architecture.png`, `04-agent-workflow.png` (16 PNGs total) |
| QR code on demo slide | ✅ | [`demo/QR-CODE.md`](demo/QR-CODE.md) |
| Rehearse 3-minute demo twice | ⏳ **Manual** (Phase 19) | [`demo/REHEARSAL-CHECKLIST.md`](demo/REHEARSAL-CHECKLIST.md) |
| Production screenshots (8 PNGs) | ⏳ **Manual** | [`submission/screenshots/README.md`](submission/screenshots/README.md) |

---

## Phase 18 in-repo verification (`verify-phases.sh`)

| Check | Status | Evidence |
|-------|--------|----------|
| `GOOGLE-DOC-CONTENT.md` exists (275 lines) | ✅ | `docs/submission/GOOGLE-DOC-CONTENT.md` |
| Appendix J — 10 sections | ✅ | `grep -c '^## Section'` → 10 |
| `SLIDES-COMPLETE.md` — 15 slides + Slide 12 demo | ✅ | `docs/ppt-info/SLIDES-COMPLETE.md` |
| `SUBMISSION-CHECKLIST.md` | ✅ | This file |
| `prepare-submission.sh` executable | ✅ | `scripts/prepare-submission.sh` |
| Architecture + agent workflow PNGs | ✅ | `docs/diagrams/png/01-system-architecture.png`, `04-agent-workflow.png` |
| Screenshot capture guide | ✅ | `docs/submission/screenshots/README.md` |
| **Publish Google Doc public link** | ⏳ **Manual** | Cannot automate from repo |
| **BlockseBlock Final Submit** | ⏳ **Manual** | Cannot automate from repo |

---

## BlockseBlock platform steps

⏳ **All manual — requires BlockseBlock account**

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

| Item | Status | Evidence |
|------|--------|----------|
| Demo script with click paths | ✅ | [`demo/APPENDIX-I-DEMO-SCRIPT.md`](demo/APPENDIX-I-DEMO-SCRIPT.md) |
| Rehearsal checklist (2× timed) | ✅ | [`demo/REHEARSAL-CHECKLIST.md`](demo/REHEARSAL-CHECKLIST.md) |
| QR code PNG for Slide 12 | ✅ | [`demo/qr-production.png`](demo/qr-production.png) · [`scripts/generate-demo-qr.sh`](../scripts/generate-demo-qr.sh) |
| Phase 0–19 tracker 100% | ✅ | [`PHASE-COMPLETION-TRACKER.md`](PHASE-COMPLETION-TRACKER.md) |
| Monitor `GET /api/health` during evaluation | ⏳ **Manual** | UptimeRobot or cron |
| Do **not** delete AI Studio app until evaluation ends | ⏳ **Manual** | Ops policy |
| Keep Cloud Run running | ⏳ **Manual** | Avoid breaking deploys |
| Judge demo with `DEMO_WARD_001` seed data | ✅ Script | `make seed` |

---

## Quick reference

| Document | Path |
|----------|------|
| Google Doc content (paste-ready) | [`submission/GOOGLE-DOC-CONTENT.md`](submission/GOOGLE-DOC-CONTENT.md) |
| Screenshot capture guide | [`submission/screenshots/README.md`](submission/screenshots/README.md) |
| Full slide speaker notes | [`ppt-info/SLIDES-COMPLETE.md`](ppt-info/SLIDES-COMPLETE.md) |
| API contract | [`api_contract.md`](api_contract.md) |
| Architecture | [`architecture.md`](architecture.md) |
| Deployment runbook | [`deployment.md`](deployment.md) |
| Submission prep script | [`../scripts/prepare-submission.sh`](../scripts/prepare-submission.sh) |
| Master plan | [`planning/Community-Hero-Master-Plan.pdf`](planning/Community-Hero-Master-Plan.pdf) |
| Phase plan | [`planning/Community-Hero-Phase-Development-Plan.pdf`](planning/Community-Hero-Phase-Development-Plan.pdf) |
| Manual TODO | [`TODO.md`](TODO.md) |

**Project:** `community-hero-vibe2ship` · **Region:** `asia-south1` · **Service:** `community-hero`
