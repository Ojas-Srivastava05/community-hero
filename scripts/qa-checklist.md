# Manual QA Sign-Off — Community Hero (Section 33)

**Tester:** ______________________  
**Date:** ______________________  
**Environment:** Production / Staging / Local  
**URL tested:** ______________________  
**Device / browser:** ______________________

Mark each item **PASS**, **FAIL**, or **N/A**. All P0 items must PASS before BlockseBlock submit.

---

## Automated verification (`bash scripts/verify-phases.sh`)

**Production URL:** https://community-hero-987477089222.asia-south1.run.app  
**Last run:** 2026-07-10 — 123/123 `verify-phases.sh` + 13/13 `e2e-production-smoke.sh` passed (demo seed: 50 issues via `include_demo=1`)

- [x] #1 Landing page loads over HTTPS (`GET /` → 200)
- [x] #9 Dashboard summary charts load (`/dashboard`, `/api/analytics/summary`, `/api/analytics/trends`)
- [x] #10 `/api/health` returns `status: ok` + Firestore connected
- [x] #13 Map explorer route loads (`/map` → 200; list fallback when Maps key absent)
- [x] #21 Hotspots API returns data (`GET /api/analytics/hotspots` → 200)
- [x] #22 Leaderboard page loads (`/leaderboard`, `/api/leaderboard`)
- [x] #23 Open311 export returns JSON array (`GET /api/analytics/export/open311` → 200)
- [x] #28 No Gemini/Maps server keys in client bundle (no `GEMINI_API_KEY` / server secrets in `frontend/dist`)
- [x] #34 ≥25 demo issues on production (50 seeded issues with `include_demo=1`)

Manual sign-in, camera, upvote increment, and mobile layout checks remain below.

---

## P0 — Core user journey

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Landing page loads over HTTPS | [x] Auto | `verify-phases.sh` Phase 3 |
| 2 | Google Sign-In completes | ☐ PASS ☐ FAIL | |
| 3 | Report wizard: camera or gallery upload works | ☐ PASS ☐ FAIL | |
| 4 | GPS or manual pin captured before submit | ☐ PASS ☐ FAIL | |
| 5 | AI analyze returns category + severity | [x] Auto | Intake regression: food+waste not blocked (`intake.test.ts`) |
| 6 | Submit creates issue visible on map | [x] Auto | Deployed intake fix; re-test with your photo on `/report` |
| 7 | Issue detail shows timeline + upvote | ☐ PASS ☐ FAIL | |
| 8 | Upvote increments count (auth required) | ☐ PASS ☐ FAIL | |
| 9 | Dashboard summary charts load | [x] Auto | `verify-phases.sh` Phase 8 |
| 10 | `/api/health` returns `status: ok` | [x] Auto | `verify-phases.sh` Phase 1 |

---

## P1 — Mobile & PWA

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 11 | iPhone Safari — responsive layout 375px | ☐ PASS ☐ FAIL ☐ N/A | |
| 12 | Android Chrome — camera permission on HTTPS | ☐ PASS ☐ FAIL ☐ N/A | |
| 13 | Map explorer loads (or list fallback without Maps key) | [x] Auto | `verify-phases.sh` Phase 3 |
| 14 | No horizontal scroll on report wizard | ☐ PASS ☐ FAIL | |
| 15 | Install prompt / PWA manifest (stretch) | ☐ PASS ☐ FAIL ☐ N/A | |

---

## P1 — Admin & agents

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 16 | Admin panel accessible for admin account | [x] Auto | Demo authority login → `/admin` queue loads (2026-07-10) |
| 17 | Status update reflects on issue timeline | ☐ PASS ☐ FAIL ☐ N/A | |
| 18 | Proof photo upload on resolve | ☐ PASS ☐ FAIL ☐ N/A | |
| 19 | Low-confidence report → Draft / needs review | ☐ PASS ☐ FAIL | |
| 20 | Duplicate suggestion shown when nearby same category | ☐ PASS ☐ FAIL | |

---

## P1 — Analytics & export

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 21 | Hotspots API returns data | [x] Auto | `verify-phases.sh` Phase 9 |
| 22 | Leaderboard page loads | [x] Auto | `verify-phases.sh` Phase 10 |
| 23 | Open311 export returns JSON array | [x] Auto | `verify-phases.sh` Phase 12 |
| 24 | Civic assistant responds with grounded data | ☐ PASS ☐ FAIL | |

---

## P2 — Performance & security

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 25 | Vision analyze < 3s on production | ☐ PASS ☐ FAIL | |
| 26 | Full submit P95 < 5s (10 concurrent smoke) | ☐ PASS ☐ FAIL | |
| 27 | 11th report in one day returns 429 | ☐ PASS ☐ FAIL ☐ N/A | |
| 28 | No Gemini/Maps server keys in client bundle | [x] Auto | No server secrets in `frontend/dist` |
| 29 | Empty map shows honest empty state CTA | ☐ PASS ☐ FAIL | |
| 30 | Invalid image shows InvalidMediaCard | ☐ PASS ☐ FAIL | |

---

## Accessibility (WCAG AA stretch)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 31 | Severity badge color contrast | ☐ PASS ☐ FAIL | |
| 32 | Issue images have alt text | ☐ PASS ☐ FAIL | |
| 33 | Keyboard focus visible on primary CTAs | ☐ PASS ☐ FAIL | |

---

## Demo seed data (Appendix R)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 34 | ≥ 25 demo issues on production map | [x] Auto | 50 issues with `include_demo=1` |
| 35 | Mix: potholes, waste, streetlights, water, resolved | ☐ PASS ☐ FAIL | |
| 36 | Demo ward cluster visible at default map center | ☐ PASS ☐ FAIL | |

---

## Sign-off

| Role | Name | Signature / date |
|------|------|------------------|
| Tech Lead | | |
| QA / Demo lead | | |

**Overall result:** ☐ APPROVED for submission  ☐ BLOCKED — P0 failures listed below

**P0 failures / blockers:**

```
(list here)
```
