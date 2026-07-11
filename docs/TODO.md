# Community Hero — Build status

**Phases 0–19:** ✅ 100% complete for all in-repo deliverables  
**Tracker:** [`PHASE-COMPLETION-TRACKER.md`](PHASE-COMPLETION-TRACKER.md)  
**Changelog:** [`CHANGELOG.md`](CHANGELOG.md) § v1.0.0-submission

---

## Complete (Phases 0–17 — product + docs + CI)

- [x] Phase 0 — Foundation, evaluation matrix, competitive analysis ([`PHASE-0-FOUNDATION.md`](PHASE-0-FOUNDATION.md))
- [x] Civic Canvas UI — all 18 routes (incl. `/privacy`, `/waiting`, `/admin/analytics`)
- [x] Firebase Auth + Firestore rules + indexes
- [x] Report wizard — WebP resize, InvalidMediaCard, AI analysis → create with confidence
- [x] Google Maps explorer — severity markers, search, 15s poll / Firestore realtime
- [x] Issue detail — verification tiers, upvote toasts, timeline, proof display
- [x] My Reports, Activity feed (location-filtered, threads links)
- [x] Impact dashboard — KPIs, trends chart, hotspots, AI insight, engagement metrics
- [x] Admin panel — status updates + proof photo upload
- [x] Leaderboard (opt-in), gamification badges + streak bonus + points toasts
- [x] Civic assistant — Gemini function calling + keyword fallback
- [x] Agent pipeline — routing, SLA, dedup, priority score, notifications
- [x] Open311 export (bulk + per-issue) with service codes
- [x] GET `/api/departments`, `/api/analytics/trends`, `/api/analytics/hotspots`
- [x] Rate limits + Retry-After + `/waiting` page on 429
- [x] Gemini L2 image cache, INVALID_MEDIA validation
- [x] PWA manifest (basic)
- [x] Cloud Run deploy: https://community-hero-987477089222.asia-south1.run.app
- [x] Demo seed data script (`make seed`)
- [x] `docs/api_contract.md` — full REST API reference
- [x] `docs/architecture.md`, `docs/deployment.md`, `docs/README.md`
- [x] Mermaid diagrams: 01, 04, 05, 08, 12
- [x] `Makefile` — `test`, `lint`, `health`, `verify`
- [x] `.github/workflows/ci.yml`
- [x] `server/src/lib/priority.test.ts`
- [x] [`scripts/verify-phases.sh`](../scripts/verify-phases.sh)

---

## Complete (Phase 18 — submission package, in-repo)

- [x] [`submission/GOOGLE-DOC-CONTENT.md`](submission/GOOGLE-DOC-CONTENT.md) — Appendix J all 10 sections + evaluation mapping
- [x] [`ppt-info/SLIDES-COMPLETE.md`](ppt-info/SLIDES-COMPLETE.md) — 15 slides full speaker notes
- [x] [`ppt-info/SUBMISSION.md`](ppt-info/SUBMISSION.md) — slide outline
- [x] [`SUBMISSION-CHECKLIST.md`](SUBMISSION-CHECKLIST.md) — in-repo items checked with evidence
- [x] [`../scripts/prepare-submission.sh`](../scripts/prepare-submission.sh) — tags `v1.0.0-submission`, prints 3 BlockseBlock URLs
- [x] [`../README.md`](../README.md) — architecture links, 8-feature table, team, live URLs
- [x] [`submission/screenshots/README.md`](submission/screenshots/README.md) — 8 screenshot capture paths for Google Doc
- [x] [`CHANGELOG.md`](CHANGELOG.md) — v1.0.0-submission entry

---

## Complete (Phase 19 — demo & closure, in-repo)

- [x] [`demo/APPENDIX-I-DEMO-SCRIPT.md`](demo/APPENDIX-I-DEMO-SCRIPT.md) — timed 3-minute script with click paths
- [x] [`demo/REHEARSAL-CHECKLIST.md`](demo/REHEARSAL-CHECKLIST.md) — twice-timed + backup video steps
- [x] [`demo/QR-CODE.md`](demo/QR-CODE.md) — production URL for jury slide
- [x] [`PHASE-COMPLETION-TRACKER.md`](PHASE-COMPLETION-TRACKER.md) — phases 0–19 at 100%

---

## Manual steps only (requires external accounts / consoles)

### Firebase / Cloud Run — automated 2026-06-27

- [x] Authorized domain `community-hero-987477089222.asia-south1.run.app` (already configured)
- [x] Google Sign-In provider enabled (`firebase deploy --only auth`)
- [x] Admin custom claim for `srivastavaojas454@gmail.com` (UID `8xj7BmsQA3ZW6dPRerGKG3Zc1Rn2`) — **sign out & back in** to refresh token
- [x] `GEMINI_API_KEY` + `ADMIN_SECRET` on Cloud Run (`community-hero-00020-dtk`) — values in **`.env.local`** (gitignored)
- [x] GCS uploads bucket `community-hero-vibe2ship-uploads` in use
- [ ] Firebase Storage **console** “Get Started” (one click) — only needed to deploy `storage.rules` via CLI; uploads already work via Admin SDK

### You still do in the browser

1. **Sign in with Google** once on production (assistant, report, upvote) — I cannot click OAuth for you
2. After admin claim: sign **out** and **back in** so Open311 export + admin UI see `admin: true`

### Google Docs (Appendix J)

7. Copy [`submission/GOOGLE-DOC-CONTENT.md`](submission/GOOGLE-DOC-CONTENT.md) into a new Google Doc
8. Add production screenshots at placeholder paths
9. Set sharing to **Anyone with the link → Viewer**
10. Copy the public URL for BlockseBlock

### BlockseBlock (deadline: June 29, 2026, 2:00 PM)

11. Log in to BlockseBlock dashboard
12. **Create Project** → select **Community Hero** problem statement
13. Enter deployed app URL: `https://community-hero-987477089222.asia-south1.run.app`
14. Enter GitHub URL: `https://github.com/Ojas-Srivastava05/community-hero`
15. Enter Google Doc public link
16. Review all fields → **Final Submit** (irreversible)

### Demo rehearsal (Phase 19)

17. Rehearse [`demo/APPENDIX-I-DEMO-SCRIPT.md`](demo/APPENDIX-I-DEMO-SCRIPT.md) **twice**, timed ≤3:00 — [`demo/REHEARSAL-CHECKLIST.md`](demo/REHEARSAL-CHECKLIST.md)
18. Record backup demo video per rehearsal checklist
19. Monitor `GET /api/health` during evaluation (UptimeRobot or cron)
20. Do **not** delete AI Studio app until evaluation ends

---

## Post-submission stretch (optional, not blocking)

- Video reporting + keyframe extraction
- Gemini embeddings dedup (Model C) — implemented (`text-embedding-004` + geohash)
- MarkerClusterer library
- [x] 16/16 mermaid diagrams + PNG exports — `docs/diagrams/` (Phase 15)
- Full E2E browser test suite
- Bilingual EN/HI assistant
- WhatsApp share agent

---

## Quick commands

```bash
bash scripts/prepare-submission.sh   # tag + print BlockseBlock URLs
bash scripts/verify-phases.sh        # production smoke tests
make test && make lint               # local CI parity
make seed                            # demo ward data
make deploy                          # Cloud Run
```
