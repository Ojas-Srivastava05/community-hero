# Appendix I — 3-Minute Judge Demo Script

**Product:** CIVICPULSE AI (Community Hero)  
**Production URL:** https://community-hero-987477089222.asia-south1.run.app  
**Backup URL:** https://community-hero-eight.vercel.app  
**Target duration:** 2:50 (10-second buffer before hard 3:00 cap)  
**Seed ward:** `DEMO_WARD_001` — run `make seed` if map is sparse

---

## Pre-demo setup (5 minutes before)

| Step | Action |
|------|--------|
| 1 | Open **incognito** browser on demo device (phone preferred for authenticity) |
| 2 | Navigate to production URL; confirm `/api/health` returns `status: ok` |
| 3 | Sign in with Google test account (not personal if privacy concern) |
| 4 | Open second incognito tab on backup device for upvote demo OR pick pre-upvoted seeded issue |
| 5 | Pre-load admin account in separate tab if showing status update |
| 6 | Close unrelated tabs; enable Do Not Disturb |
| 7 | If presenting, mirror phone to projector; test HDMI/wireless |

**Failure fallbacks:** See [`REHEARSAL-CHECKLIST.md`](REHEARSAL-CHECKLIST.md)

---

## Timed script with click paths

### 0:00 — 0:20 | Landing + context

**Say:** "Community Hero turns citizen photos into accountable civic records. This is live on Cloud Run—not a prototype."

| Time | Click path | Show |
|------|------------|------|
| 0:00 | Open `https://community-hero-987477089222.asia-south1.run.app/` | Landing hero, Civic Glass dark UI |
| 0:05 | Scroll if needed | Sign-in CTA, live issue count (if displayed) |
| 0:10 | Click **Sign in with Google** | Google OAuth popup |
| 0:15 | Complete sign-in | Redirect to map or home authenticated state |

**Checkpoint:** Auth succeeds without `auth/unauthorized-domain` error.

---

### 0:20 — 0:45 | Map explorer

**Say:** "Every report is geotagged and visible to the community. Severity colors help triage at a glance."

| Time | Click path | Show |
|------|------------|------|
| 0:20 | Navigate to `/map` (bottom nav **Map** or URL bar) | Google Maps or list fallback |
| 0:25 | Tap **Filters** → select **Pothole** (or category with seeded data) | Filtered markers |
| 0:30 | Tap a **red/orange marker** (high severity) | Issue preview or navigate to detail |
| 0:35 | If preview card: tap **View details** | Issue detail page loads |
| 0:40 | Point at map pin location | Address / ward label |

**Checkpoint:** At least one seeded issue visible. If empty: `make seed` on server or use direct issue URL from seed output.

---

### 0:45 — 1:10 | Issue detail + upvote

**Say:** "Neighbors upvote to verify. At three votes, status becomes Community Verified—reducing duplicate noise."

| Time | Click path | Show |
|------|------------|------|
| 0:45 | On `/issues/:id` | Photo, title, category chip, severity |
| 0:50 | Scroll to **Timeline** | Events: ai_analysis, routing, status |
| 0:55 | Tap **Upvote** (heart/thumb) | Toast confirmation; count increments |
| 1:00 | Show **Verification level** badge | Tier 1/2/3 indicator |
| 1:05 | Point at **SLA countdown** / department | Agent routing output |

**Alternate:** Second device upvotes same issue to show tier jump (prep issue at 2 votes in seed).

---

### 1:10 — 1:50 | Report wizard + AI analyze

**Say:** "Three taps: photo, GPS, confirm. Gemini classifies in under three seconds."

| Time | Click path | Show |
|------|------------|------|
| 1:10 | Navigate to `/report` (FAB or **Report** nav) | Step 1 — camera capture |
| 1:15 | Tap **Take photo** or **Upload** | Use seed pothole image if live camera awkward |
| 1:20 | Allow **location** permission | GPS indicator green |
| 1:25 | Tap **Next** → Step 2 | Loading: "AI analyzing..." |
| 1:35 | Review AI card | Category, severity, title, confidence % |
| 1:40 | Edit one field (optional) | Form is editable |
| 1:45 | Tap **Next** → Step 3 confirm map pin | Mini-map with pin |
| 1:48 | Tap **Submit** | Success toast; redirect to issue or map |

**Shortcut:** If time tight or Gemini unavailable, stop at Step 2 AI card—say "submit would persist to Firestore and trigger six agents."

---

### 1:50 — 2:10 | Impact dashboard

**Say:** "Municipal stakeholders see KPIs, trends, and predictive hotspots—not just a ticket queue."

| Time | Click path | Show |
|------|------------|------|
| 1:50 | Navigate to `/dashboard` | KPI tiles: open, resolved, avg resolution |
| 1:55 | Scroll to **Trends chart** | Recharts line/bar by category |
| 2:00 | Point at **Hotspot** card | Ward risk score, geohash cluster |
| 2:05 | Read **AI insight** snippet (if present) | Gemini narrative |

---

### 2:10 — 2:30 | Civic assistant

**Say:** "Natural language over live data—function calling, not hallucinated addresses."

| Time | Click path | Show |
|------|------------|------|
| 2:10 | Navigate to `/assistant` | Chat UI |
| 2:12 | Type: **"What open potholes are near me?"** | Send |
| 2:18 | Wait for response | Tool-grounded issue list or summary |
| 2:25 | Optional second query: **"How many issues are resolved this week?"** | Analytics-aware reply |

---

### 2:30 — 2:50 | Admin resolve (optional) + close

**Say:** "Admins close the loop with proof photos. Every step is on the public timeline."

| Time | Click path | Show |
|------|------------|------|
| 2:30 | Navigate to `/admin` (admin account) | Issue queue |
| 2:35 | Select issue → **In Progress** | Status update + timeline event |
| 2:40 | Skip full resolve if low time | Mention proof upload capability |
| 2:45 | **Close tab to GitHub** or show slide 14 | Repo + Google Doc links |

**Closing line:** "Open source on GitHub, live on Cloud Run, built on Gemini and Firebase. Questions?"

---

## Post-demo Q&A prep

| Likely question | Answer pointer |
|-----------------|----------------|
| How is this different from Swachhata? | `docs/COMPETITIVE-MATRIX.md` — agents + vision + hotspots |
| Security? | `firestore.rules`, server-side auth, rate limits `/waiting` on 429 |
| Agent architecture? | `docs/diagrams/mermaid/04-agent-workflow.mmd` |
| Open311? | `GET /api/analytics/export/open311` |
| Scale? | Geohash indexes, Cloud Run autoscale, L2 Gemini cache |

---

## Timing summary

| Block | Duration | Cumulative |
|-------|----------|------------|
| Landing + sign-in | 0:20 | 0:20 |
| Map + issue | 0:25 | 0:45 |
| Upvote + timeline | 0:25 | 1:10 |
| Report wizard | 0:40 | 1:50 |
| Dashboard | 0:20 | 2:10 |
| Assistant | 0:20 | 2:30 |
| Admin + close | 0:20 | 2:50 |

**Total:** 2:50 (+ 0:10 buffer)

---

## Related documents

- [`REHEARSAL-CHECKLIST.md`](REHEARSAL-CHECKLIST.md) — twice-timed rehearsal protocol
- [`QR-CODE.md`](QR-CODE.md) — jury slide QR
- [`../ppt-info/SLIDES-COMPLETE.md`](../ppt-info/SLIDES-COMPLETE.md) — Slide 12 notes
- [`../PHASE-COMPLETION-TRACKER.md`](../PHASE-COMPLETION-TRACKER.md) — Phase 19 evidence
