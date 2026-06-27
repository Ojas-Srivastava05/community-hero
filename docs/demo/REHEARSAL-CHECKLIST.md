# Demo Rehearsal Checklist (Phase 19)

Rehearse the judge demo **twice**, timed, on **production** before BlockseBlock deadline.

**Script:** [`APPENDIX-I-DEMO-SCRIPT.md`](APPENDIX-I-DEMO-SCRIPT.md)  
**Production URL:** https://community-hero-987477089222.asia-south1.run.app

---

## Environment prep (once)

- [x] Demo script committed with click paths — [`APPENDIX-I-DEMO-SCRIPT.md`](APPENDIX-I-DEMO-SCRIPT.md)
- [x] QR code doc for jury slide — [`QR-CODE.md`](QR-CODE.md)
- [x] Production URL health + Firestore connected — `bash scripts/verify-phases.sh` Phase 1
- [x] Core routes return 200 (`/`, `/map`, `/report`, `/dashboard`, `/leaderboard`, `/assistant`, `/admin`) — `verify-phases.sh` Phases 3–11, 14
- [x] Analytics APIs respond (summary, trends, hotspots, Open311 export) — `verify-phases.sh` Phases 8–9, 12
- [x] Demo seed ≥25 issues on production (50 with `include_demo=1`) — `verify-phases.sh` Phase 17
- [x] 16 mermaid diagram sources + 15 slide files in repo — `verify-phases.sh` Phase 15
- [x] Firebase Auth authorized domain includes Cloud Run hostname — configured 2026-06-27 ([`TODO.md`](../../TODO.md))
- [x] Production has ≥20 demo issues (50 with `include_demo=1`) — verified via `verify-phases.sh` Phase 17
- [x] `GEMINI_API_KEY` set on Cloud Run for live AI analyze — configured 2026-06-27 (keyword fallback if key fails)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` in build for map tiles — **manual** (list fallback works on `/map`)
- [ ] Google test account credentials shared with demo presenter — **manual**
- [x] Admin custom claim for demo admin — see [`FIREBASE-ADMIN-CLAIMS.md`](../FIREBASE-ADMIN-CLAIMS.md); sign out/in to refresh token

---

## Rehearsal run 1

**Date:** _______________  
**Presenter:** _______________  
**Device:** _______________

| Step | Done | Notes |
|------|------|-------|
| Start timer at 0:00 on production URL | ☐ | |
| Complete full script through 2:50 close | ☐ | |
| Record stop time: _______ (target ≤ 3:00) | ☐ | |
| Sign-in worked incognito | ☐ | |
| Map showed seeded issues | ☐ | |
| Upvote succeeded | ☐ | |
| AI analyze returned (or fallback acknowledged) | ☐ | |
| Dashboard charts loaded | ☐ | |
| Assistant responded | ☐ | |
| Admin status update (if attempted) | ☐ | |

**Issues found run 1:**

```
(free text)
```

---

## Rehearsal run 2

**Date:** _______________  
**Presenter:** _______________  
**Device:** _______________

| Step | Done | Notes |
|------|------|-------|
| Incognito fresh session (no cached auth) | ☐ | |
| Complete full script through 2:50 close | ☐ | |
| Record stop time: _______ (target ≤ 3:00) | ☐ | |
| All checkpoints from run 1 green | ☐ | |
| Trimmed any section &gt;30s over target | ☐ | |

**Issues found run 2:**

```
(free text)
```

---

## Sign-off

| Criterion | Run 1 | Run 2 |
|-----------|-------|-------|
| Total time ≤ 3:00 | ☐ | ☐ |
| No P0 demo blockers | ☐ | ☐ |
| Presenter confident without reading script | ☐ | ☐ |

**Demo ready for jury:** ☐ Yes ☐ No — escalate blockers in `TODO.md`

---

## Backup video recording steps

If live demo fails (network, auth, projector), play pre-recorded backup.

### Recording setup

1. **Tool:** QuickTime (macOS), OBS, or phone screen record
2. **Resolution:** 1080p minimum; portrait OK for mobile-first narrative
3. **Audio:** Narrate script lines from [`APPENDIX-I-DEMO-SCRIPT.md`](APPENDIX-I-DEMO-SCRIPT.md)
4. **Duration:** Match 2:50 script; edit dead air in post

### Recording checklist

| Step | Done |
|------|------|
| Production URL loaded in incognito | ☐ |
| Sign-in captured (blur email if needed) | ☐ |
| Map → issue → upvote sequence | ☐ |
| Report wizard through AI analyze | ☐ |
| Dashboard + hotspot card | ☐ |
| Assistant query | ☐ |
| Admin status change (optional) | ☐ |
| End card: GitHub + Cloud Run URL (5 sec hold) | ☐ |

### Backup storage

| Item | Location |
|------|----------|
| Raw recording | Google Drive / team shared folder — **manual** |
| Edited MP4 (&lt;50 MB for email) | Same |
| Slide embed | Link from Google Slides → Insert video |

### Playback fallback procedure

1. Announce: "I'll show our recorded walkthrough while we troubleshoot live auth."
2. Play video full-screen from Drive or local file
3. Keep incognito tab open—offer live Q&A on `/map` after video
4. Log incident for post-mortem (auth domain, cold start, etc.)

---

## Post-rehearsal monitoring (evaluation period)

- [ ] Monitor `GET /api/health` every 5 min — UptimeRobot free tier — **manual**
- [ ] Do not delete AI Studio app until evaluation ends — **manual**
- [ ] Avoid breaking deploys on `main` during jury window — **manual**
- [ ] Keep `v1.0.0-submission` tag stable; hotfixes via patch tag if critical

---

## Related

- [`APPENDIX-I-DEMO-SCRIPT.md`](APPENDIX-I-DEMO-SCRIPT.md)
- [`QR-CODE.md`](QR-CODE.md)
- [`../SUBMISSION-CHECKLIST.md`](../SUBMISSION-CHECKLIST.md)
- [`../PHASE-COMPLETION-TRACKER.md`](../PHASE-COMPLETION-TRACKER.md)
