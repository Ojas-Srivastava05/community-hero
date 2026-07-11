# Community Hero — 8-Minute Presentation Plan

**Hackathon:** Vibe to Ship / BlockseBlock 2026 · Problem Statement 2  
**Slot:** 8 minutes total (presentation + live demo — confirm with organizers if Q&A is separate)  
**Live URL:** https://community-hero-987477089222.asia-south1.run.app  
**Build from:** This plan + `docs/ppt-info/SLIDES-COMPLETE.md` + `docs/demo/APPENDIX-I-DEMO-SCRIPT.md`

---

## What winning decks have in common

Analyzed four reference decks in `docs/reference/presentations/`:

| Deck | Slides | Hackathon | Winning pattern |
|------|--------|-----------|-----------------|
| **AutoMind — Phantom Mode** | 8 | Clash of the Claws | Tight count, **3-column problem** (definition / existing / gap), big stats, one architecture slide, impact + timeline, team last |
| **AI Insights — Review Summarizer** | 13 | — | **Story hook** (“The Dilemma”), pipeline diagram, **output screenshot**, impact before stack, creative credits |
| **TenderMind** | 13 | Gov procurement | **4-pillar solution**, step-by-step flow, **“Why existing fails vs us”**, human-in-the-loop, one memorable quote close |
| **TrustCircle (Zombie Heart)** | 16 | AI Mobile Hackathon | Stats-heavy intro, objectives, methodology — **too academic for 8 min**; steal the metrics + Google tech mapping, skip literature slides |

### Patterns to copy for Community Hero

1. **Open with pain + one stat**, not “Hi, we’re Team X for Vibe2Ship.”
2. **Problem → gap → solution** in under 90 seconds before any architecture.
3. **One diagram slide** (citizen journey OR 6-agent workflow — not both in 8 min).
4. **Show the product early** — screenshot or live demo within 3 minutes.
5. **Comparison beat** — Swachhata / municipal portals vs Community Hero (TenderMind’s “existing vs us”).
6. **Numbers on impact** — 80% faster triage, ~40% dupes, sub-3s AI (TrustCircle/TenderMind style).
7. **Google tech tied to features** — one slide or footer icons, not a lecture.
8. **Memorable closing line** — keep yours: *“Every pothole deserves a public record and a named resolution.”*
9. **8–10 slides max** for an 8-minute slot with demo; 15 slides is an 11-minute deck.

---

## Recommended time budget (8:00 hard cap)

| Block | Time | What happens |
|-------|------|----------------|
| Hook + problem + gap | 1:15 | Slides 1–2 |
| Solution + USP + journey | 1:00 | Slide 3 |
| Agentic depth (jury 20%) | 0:45 | Slide 4 |
| **Live demo** | **3:30** | Slide 5 (QR) + phone/laptop |
| Impact + Google stack | 0:45 | Slide 6 |
| Close + links | 0:45 | Slide 7 |
| Buffer | 0:00 | If over, cut agent detail not demo |

**Rule:** Demo is sacred. Trim slides 07, 10, 11, and 14 from the old 15-slide kit — merge into 7 slides below.

---

## Deck structure — 7 slides (+ optional backup)

Build in **Google Slides** (easy QR, embed screenshots, export PDF backup).

### Slide 1 — Title + one-line thesis (0:20)

**Visual:** Dark background, teal accent `#14B8A6`, app hero screenshot as bleed image (AutoMind-style full-bleed).

**On slide:**
- **Community Hero** · CIVICPULSE AI
- Vibe2Ship 2026 · Problem Statement 2
- *Photo → AI → Map → Community verify → Named resolution*
- Ojas Srivastava · Solo · GitHub + live URL in footer

**Say:** “Community Hero turns a citizen’s photo into a public, routed, verifiable civic record — live on Cloud Run today.”

**Do not:** Read evaluation criteria or hackathon rules (judges know).

---

### Slide 2 — The dilemma + the gap (0:55)

**Pattern:** AutoMind 3-column + TenderMind “existing fails”.

**Left — The dilemma**
- “Have you reported a pothole and never heard back?”
- WhatsApp groups, municipal portals, ad-hoc apps — no shared record
- Duplicate photos of the same leak waste field crews

**Center — What exists**
- **Swachhata** — 4,000+ cities, proved citizen demand
- **FixMyStreet** — mature UX, no Gemini vision or agents
- Manual municipal desks — slow triage

**Right — The gap**
- No sub-3-second AI classification at submit
- No agentic routing + SLA + dedup pipeline
- No public timeline from submitted → resolved

**Stat callout (big number):** *Millions of urban complaints/year · opacity is the default*

**Say:** “Demand is proven. The gap is speed, routing intelligence, and public accountability.”

---

### Slide 3 — Solution + citizen journey (1:00)

**Pattern:** TenderMind 4 pillars + AI Insights pipeline.

**Four pillars (icons):**

| Pillar | One line |
|--------|----------|
| **3s AI triage** | Gemini Vision → category, severity, department |
| **6-agent pipeline** | Route, SLA, dedup, priority — no manual desk |
| **Community verify** | Boost tiers cut ~40% duplicate noise |
| **Public accountability** | Timeline + proof photo + Open311 export |

**Pipeline (single horizontal flow):**
```
Photo + GPS → Gemini → Firestore → Map → Boost → Verified → Resolved
```

**Embed:** `docs/diagrams/png/05-report-intake-sequence.png` OR one phone screenshot collage (Landing + Map + Timeline).

**Say:** “Same rigor as enterprise logistics — mission is communities, not cargo. All eight official Vibe2Ship features ship in production.”

---

### Slide 4 — Why we win: agentic depth (0:45)

**Pattern:** AI Insights “algorithm logic” — one technical slide, high signal.

**Embed:** `docs/diagrams/png/04-agent-workflow.png`

**Bullets (max 4):**
- Six **discrete agents** in code — not one mega-prompt
- Low confidence → **Draft queue** (human-in-the-loop, TenderMind-style)
- Geohash dedup → duplicate merge suggestions
- Vision pre-submit; routing uses auditable department map

**Say:** “This is what scores Agentic Depth — conditional branches you can audit on GitHub.”

**Skip in 8 min:** Full system architecture slide (mention “single Cloud Run container” verbally during demo).

---

### Slide 5 — Live demo (3:30)

**Pattern:** AI Insights “output example” — but live, not static.

**On slide:** Large QR code · URL · “Submit without login — no personal data required”

**Compressed demo script** (from `docs/demo/APPENDIX-I-DEMO-SCRIPT.md`):

| Time | Action | Jury line |
|------|--------|-----------|
| 0:00 | `/` → **Submit without login** | Privacy-first reporting |
| 0:25 | **Map** → filter Pothole → open issue | Geo + severity at a glance |
| 0:50 | Issue detail → **Boost** → agent stepper + SLA | Community verify + agents visible |
| 1:15 | **Report** → photo → **AI Analyze** → submit | Sub-3s Gemini classification |
| 2:00 | **Dashboard** → charts + hotspot | Predictive + impact |
| 2:25 | **Assistant** → “What open potholes are near me?” | Gemini tool-calling on live data |
| 2:50 | **Admin** (demo authority) → In Progress | End-to-end closure |
| 3:10 | Back to slide — GitHub + live URL | “Everything you saw is in the repo” |

**Pre-stage:** Incognito phone, `make seed` if map empty, DND on, `/api/health` ok.

**Backup:** Vercel preview · seeded screenshot folder · 30s screen recording.

---

### Slide 6 — Impact + built on Google (0:45)

**Pattern:** TrustCircle metrics + TenderMind stakeholder impact.

**Two columns:**

**Impact (design targets — say honestly “demo ward + architecture”)**

| Metric | Claim |
|--------|-------|
| Triage | **80% faster** vs manual forms |
| Dupes | **~40%** reduction (geohash + verify) |
| AI latency | **&lt;3s** vision analyze |
| Transparency | **100%** public status timelines |

**Google technologies (icon row — tie to demo moments)**

- **Gemini 2.5 Flash** — report wizard, assistant, insights  
- **Firebase** — Auth, Firestore, Storage  
- **Maps Platform** — explorer + geocoding  
- **Cloud Run** — production HTTPS · **AI Studio** — prototype → deploy path  

**Say:** “Impact and innovation at 20% each — we built for those criteria deliberately.”

---

### Slide 7 — Close (0:45)

**Pattern:** TenderMind one-liner + AutoMind team/footer.

**On slide:**
- **“Every pothole deserves a public record and a named resolution.”**
- Live app · GitHub · Google Doc (QR or short URL)
- Thank you — questions?

**Footer links:**

| | URL |
|---|-----|
| App | https://community-hero-987477089222.asia-south1.run.app |
| GitHub | https://github.com/Ojas-Srivastava05/community-hero |

**Say:** “Open source, live today — happy to walk agents, Firestore rules, or Open311 export in Q&A.”

---

## Optional backup slides (hidden — Q&A only)

Keep these **after** slide 7, hidden unless asked:

- **B1** — Full architecture (`01-system-architecture.png`)
- **B2** — Full tech stack table (old slide 10)
- **B3** — Screenshot gallery (old slide 07)
- **B4** — Competitive matrix vs Swachhata / FixMyStreet

---

## Visual design guide (match Civic Glass + winning decks)

| Element | Guidance |
|---------|----------|
| **Background** | Dark `#0F172A` or map-first dark — matches app |
| **Accent** | Teal `#14B8A6` for headings, CTAs, severity “medium” |
| **Typography** | One sans (Inter / DM Sans); max 2 sizes per slide |
| **Text** | **6 bullets max** per slide; 32pt+ for stat callouts |
| **Images** | Phone mockups for UI; full-bleed photo for problem slide (pothole) |
| **Diagrams** | Use repo PNGs — already jury-ready |
| **Footer** | Live URL + slide number on every slide |
| **Avoid** | Literature review slides, paragraph walls, reading all 8 features |

**Reference mood:** TenderMind’s clean sections + AutoMind’s stat callouts + AI Insights’ single “output” hero moment (your demo).

---

## Speaker script cheat sheet (print this)

```
0:00  [S1]  "Community Hero — citizen photo to accountable civic record. Live on Cloud Run."
0:20  [S2]  Hook question → Swachhata proved demand → gap is AI speed + agents + transparency
1:15  [S3]  Four pillars + one-line pipeline → "all 8 official features shipped"
2:15  [S4]  Six agents, draft queue, dedup — "auditable on GitHub"
3:00  [S5]  "Follow the QR — submit without login"
      ...   [DEMO — see table above] ...
6:30  [S6]  Metrics + Google stack mapped to what they just saw
7:15  [S7]  Thesis line + links + "questions?"
8:00  STOP
```

---

## Mapping to jury weights (what each slide scores)

| Criterion | Weight | Slides that prove it |
|-----------|--------|----------------------|
| Impact | 20% | S2 problem, S6 metrics, demo dashboard/hotspot |
| Agentic depth | 20% | S4 agents, demo agent stepper on issue detail |
| Innovation | 20% | S3 USP, dedup + verify combo, assistant |
| Google tech | 15% | S6 + demo (Firebase sign-in optional, Maps, Gemini live) |
| Product experience | 10% | Demo Civic Glass UI, submit-without-login |
| Technical | 10% | S4 + "single Cloud Run container" + GitHub |
| Completeness | 5% | S3 "8/8 features", admin resolve in demo |

---

## What to cut from the old 15-slide kit

| Old slide | Action |
|-----------|--------|
| 01 Guidelines & evaluation | **Cut** — open with thesis instead |
| 02 Team | **Merge** into slide 1 footer (solo — 5 seconds max) |
| 05 Features (8 bullets) | **Merge** into slide 3 one-liner |
| 07 Wireframes | **Cut** from main deck → backup B3 or demo replaces |
| 08 Architecture | **Backup B1** only |
| 10 Tech stack | **Backup B2** only |
| 11 Google technologies | **Merge** into slide 6 |
| 12 Live demo | **Becomes** slide 5 |
| 14 Links | **Merge** into slide 7 |

---

## Build checklist

- [ ] Create Google Slides deck with **7 slides** from this plan
- [ ] Export PDF to Google Drive backup
- [ ] Generate QR → slide 5 (`docs/demo/QR-CODE.md`)
- [ ] Capture 3 screenshots minimum: report AI card, map, issue timeline
- [ ] Rehearse **twice timed** with phone demo (target 7:45)
- [ ] Paste Google Doc public link on slide 7 before BlockseBlock submit
- [ ] Hidden backup slides ready for Q&A

---

## If organizers give 8 min slides + separate demo

Use **10 slides / 8 min** with a **4-minute demo**:

- Expand slide 4 with architecture (`01-system-architecture.png`) +30s
- Add slide 8: screenshot collage +30s
- Demo: cut assistant + admin → 2:00 map/issue/report/dashboard only

---

## One-page slide outline (copy into Google Slides speaker notes)

1. **Title** — thesis + solo credit  
2. **Dilemma / gap / existing** — 3 columns + stat  
3. **Solution** — 4 pillars + pipeline diagram  
4. **Agents** — workflow PNG + 4 bullets  
5. **Demo** — QR + timed script  
6. **Impact + Google** — metrics table + icon row  
7. **Close** — quote + links  

*Derived from reference decks in `docs/reference/presentations/` and aligned with `docs/ppt-info/SLIDES-COMPLETE.md`.*
