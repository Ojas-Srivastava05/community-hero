# Community Hero — Build status

## Complete (Phases 1–14 core product)

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
- [x] Demo seed data (25+ issues)

## Complete (Phases 15–17 — docs, tests, CI)

- [x] `docs/api_contract.md` — full REST API reference
- [x] `docs/architecture.md`, `docs/deployment.md`, `docs/README.md`
- [x] Mermaid diagrams: 01, 04, 05, 08, 12
- [x] `docs/ppt-info/SUBMISSION.md` — 15-slide outline
- [x] `docs/SUBMISSION-CHECKLIST.md` — BlockseBlock steps
- [x] `Makefile` — `test`, `lint`, `health`, `verify`
- [x] `.github/workflows/ci.yml`
- [x] `server/src/lib/priority.test.ts`

## Remaining vs Master Plan (honest gaps)

- [ ] **Deploy latest code** to Cloud Run (trends, departments, admin proof, etc.)
- [ ] Video reporting + keyframe extraction (Section 5.1 stretch)
- [ ] Gemini embeddings dedup (Model C) — geohash-only today
- [ ] MarkerClusterer library (Section 5.3)
- [ ] Full 16 mermaid diagrams + PNG exports (5/16 done)
- [ ] LogiFlow-grade doc volume (~8000 lines target)
- [ ] Full E2E browser test suite
- [ ] Bilingual EN/HI assistant
- [ ] WhatsApp share agent
- [ ] BlockseBlock submission + public Google Doc (Phase 18 — manual)
- [ ] Demo rehearsal + backup video (Phase 19 — manual)

## Your manual steps for BlockseBlock submission

1. **Redeploy:** `make deploy` (ships all new API + UI)
2. Add `community-hero-987477089222.asia-south1.run.app` to Firebase Auth authorized domains
3. Enable Firebase Storage for image uploads
4. Set `GEMINI_API_KEY` on Cloud Run for live AI
5. Set `VITE_GOOGLE_MAPS_API_KEY` at build time and redeploy for live maps
6. Create public Google Doc from `docs/ppt-info/SUBMISSION.md`
7. Submit 3 links on BlockseBlock before **June 29, 2026 2:00 PM**
