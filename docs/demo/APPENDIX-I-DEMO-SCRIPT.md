# Appendix I — 3-Minute Judge Demo Script

**Product:** Community Hero (CIVICPULSE AI)  
**Production URL:** https://community-hero-987477089222.asia-south1.run.app  
**Backup URL:** https://community-hero-eight.vercel.app  
**Target duration:** 2:50 (10-second buffer before hard 3:00 cap)  
**Seed ward:** multi-city demo issues — run `make seed` if map is sparse

---

## Pre-demo setup (5 minutes before)

| Step | Action |
|------|--------|
| 1 | Open **incognito** browser (phone preferred) |
| 2 | Confirm `/api/health` → `status: ok` |
| 3 | Prefer **Submit without login** (not Google OAuth on stage): `/report` → **Submit without login** — no personal email or phone |
| 4 | Second tab: `/login` → **Enter as demo authority** (for admin / resolve) |
| 5 | Close unrelated tabs; enable Do Not Disturb |
| 6 | Optional: grant location, or rely on map pin fallback |

**Failure fallbacks:** See [`REHEARSAL-CHECKLIST.md`](REHEARSAL-CHECKLIST.md)

---

## Timed script with click paths

### 0:00 — 0:20 | Landing + submit without login

**Say:** "Community Hero turns citizen photos into accountable civic records—and you can **submit without login**. No personal email or phone required."

| Time | Click path | Show |
|------|------------|------|
| 0:00 | Open production URL `/` | Light coral/paper UI, **No login required** badge |
| 0:05 | Tap **Submit without login** → `/report` → same button | One-tap access — no Google popup, no personal details |
| 0:15 | Capture flow unlocked | Photo / AI classify CTAs |

**Checkpoint:** Judge sees privacy-first reporting before any OAuth prompt.

**Judge line:** "Citizens can report anonymously—no account signup, no personal data."

---

### 0:20 — 0:45 | Map explorer

**Say:** "Every report is geotagged. Severity colors help triage at a glance — 48 issues across five Indian cities."

| Time | Click path | Show |
|------|------------|------|
| 0:20 | Bottom nav **Map** | Google Maps + markers + bottom nav still visible |
| 0:25 | Tap **Filters** → **Pothole** | Filtered markers |
| 0:30 | Tap a high-severity marker | Preview card |
| 0:35 | Tap the card | Issue detail |
| 0:40 | Point at location / ward | Address label |

**Checkpoint:** Seeded issues visible. If empty: `make seed`.

---

### 0:45 — 1:10 | Issue detail + boost

**Say:** "Neighbors boost to verify. At three boosts, status becomes Community Verified—reducing duplicate noise."

| Time | Click path | Show |
|------|------------|------|
| 0:45 | On `/issues/:id` | Photo, title, category, **department** chip, severity |
| 0:48 | Point at **Email department / WhatsApp / Copy draft** | Formal complaint mailto — FixMyStreet-style escalation |
| 0:50 | Point at **Cost of inaction** | ₹/day estimate for authority prioritisation |
| 0:52 | Scroll **agent stepper** | Dedup: **visual + geo + semantic**; Judge gate if Draft |
| 0:55 | Tap **Boost ↑** | Toast confirmation; count increments |
| 1:00 | Show verification badges | Acknowledged → Community Verified → Priority |
| 1:05 | Point at **SLA** + **department** chips | Agent routing output |

**Alternate:** Open a **Resolved** issue with before/after slider (seeded proof photos).

---

### 1:10 — 1:50 | Report wizard + AI analyze

**Say:** "Photo or video, GPS or manual pin. Gemini 2.5 Flash classifies in under three seconds — six agents take it from there."

| Time | Click path | Show |
|------|------------|------|
| 1:10 | Bottom nav **+** Report | Step 1 — capture |
| 1:15 | Upload seed pothole photo | Preview |
| 1:20 | Watch **Analyzing…** + agent stepper | Live vision call |
| 1:30 | Continue → AI card | Category, severity, **confidence %**, department |
| 1:40 | Confirm map pin (or tap map if GPS denied) | Mini-map |
| 1:45 | Submit | Redirect to issue; agent pipeline on timeline |

**Shortcut:** If time tight, stop at AI card — "submit triggers intake, vision, dedup, routing, SLA, priority."

---

### 1:50 — 2:10 | Impact dashboard + scorecards

**Say:** "Municipal stakeholders see KPIs, predictive hotspots, and department scorecards — not just a ticket queue."

| Time | Click path | Show |
|------|------------|------|
| 1:50 | Home bento **Impact** or Profile → dashboard | KPI tiles |
| 1:55 | Hotspot cards + AI insight | Predictive clusters |
| 2:00 | Tap **Scorecards** | A–D department grades |
| 2:05 | Optional: Open311 export from admin issue | Municipal integration |

---

### 2:10 — 2:30 | Civic assistant

**Say:** "Natural language over live data — function calling, not hallucinated addresses."

| Time | Click path | Show |
|------|------------|------|
| 2:10 | Home bento **Ask AI** | Chat UI |
| 2:12 | Tap prompt: **"What open potholes are near me?"** | Tool-grounded reply |
| 2:22 | Optional: **"How many issues are resolved this week?"** | Analytics-aware reply |

---

### 2:30 — 2:50 | Admin + close

**Say:** "Admins close the loop with proof photos. Every step is on the public timeline. Built to plug into real municipal systems via Open311."

| Time | Click path | Show |
|------|------------|------|
| 2:30 | Demo authority tab → `/admin` | **Authority co-pilot** dispatch card + issue queue |
| 2:35 | Point at SLA breach filter / status update | Accountability |
| 2:40 | Mention before/after AI verification | Resolution proof |
| 2:45 | Close: GitHub + Cloud Run + Gemini 2.5 + Firebase | |

**Closing line:** "We're the only finalist with municipal Open311 export, a six-agent audit trail, Judge HITL, authority co-pilot, 76 automated tests, and a live multi-city demo — built to ship, not just to pitch. Questions?"

**If asked about AI Studio:** Open https://aistudio.google.com/apps — "We started in Google AI Studio Build mode, exported to GitHub, and productionized on Cloud Run with Firebase Auth, Firestore, and Gemini 2.5 Flash. The AI Studio app stays live through judging."

**Embed widget (optional 10s):** `/embed/map` — "Drop this iframe on any RWA or news site."

**Voice (optional):** Report → Voice mic — "Speak in Hindi or English; Gemini fills the form."

**Streaming agents:** On submit, watch NDJSON agent steps light up live — not a fake timer.

---

## Post-demo Q&A prep

| Likely question | Answer pointer |
|-----------------|----------------|
| How is this different from Swachhata? | `docs/COMPETITIVE-MATRIX.md` — agents + vision + hotspots + Open311 |
| Security? | `firestore.rules`, server-side auth, rate limits `/waiting` on 429 |
| Agent architecture? | `docs/diagrams/mermaid/04-agent-workflow.mmd` |
| Open311? | `GET /api/analytics/export/open311` |
| Scale? | Geohash indexes, Cloud Run autoscale, L2 Gemini cache |
| vs streaming agent UIs? | Six specialized agents with Firestore audit trail — municipal depth over chat theatre |

---

## Timing summary

| Block | Duration | Cumulative |
|-------|----------|------------|
| Landing + demo sign-in | 0:20 | 0:20 |
| Map + issue | 0:25 | 0:45 |
| Boost + timeline | 0:25 | 1:10 |
| Report wizard | 0:40 | 1:50 |
| Dashboard + scorecards | 0:20 | 2:10 |
| Assistant | 0:20 | 2:30 |
| Admin + close | 0:20 | 2:50 |

**Total:** 2:50 (+ 0:10 buffer)

---

## Related documents

- [`REHEARSAL-CHECKLIST.md`](REHEARSAL-CHECKLIST.md) — twice-timed rehearsal protocol
- [`QR-CODE.md`](QR-CODE.md) — jury slide QR
- [`../ppt-info/SLIDES-COMPLETE.md`](../ppt-info/SLIDES-COMPLETE.md) — Slide 12 notes
- [`../PHASE-COMPLETION-TRACKER.md`](../PHASE-COMPLETION-TRACKER.md) — Phase 19 evidence
