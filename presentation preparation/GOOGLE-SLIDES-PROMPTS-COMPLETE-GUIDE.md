# Community Hero — Google Slides Prompt Guide (Complete)

**Product:** Community Hero · CIVICPULSE AI  
**Event:** Vibe to Ship / BlockseBlock 2026 · Problem Statement 2  
**Presenter:** Ojas Srivastava (solo)  
**Presentation slot:** 8 minutes (slides + live demo)  
**Live app:** https://community-hero-987477089222.asia-south1.run.app  
**GitHub:** https://github.com/Ojas-Srivastava05/community-hero  

---

## How to use this document

This PDF is your **complete copy-paste library** for Google Slides **Prompt to Slide Generation** (Gemini). Because Gemini can only **create or edit one slide at a time**, each slide has:

1. **When to use** — create vs edit  
2. **Full generation prompt** — paste into Gemini  
3. **Edit / fix prompt** — if colors or layout are wrong  
4. **Manual steps** — screenshots, QR, diagrams you insert yourself  
5. **Speaker notes** — what to say (with timing)  

**Recommended workflow:**

1. Open a blank Google Slides presentation (16:9).  
2. Go to Gemini → Prompt to Slide.  
3. For Slide 1: choose **Create new slide** → paste **Slide 1 prompt**.  
4. Review. If wrong theme: **Edit this slide** → paste **Universal color-fix prompt**.  
5. **Create new slide** → Slide 2 prompt → repeat through Slide 7.  
6. Insert images (QR, screenshots, diagrams) manually.  
7. Optional: add backup slides 8–11 for Q&A.  
8. Rehearse using timing in Section 10.  

---

## Section 1 — Why colors must match the live app

Your **deployed app** uses a **light, warm, coral-forward** design (`frontend/src/index.css`).  
The older `.stitch/DESIGN.md` described a **dark teal** theme that is **no longer** what judges see in the demo.

| Element | ❌ Old (do NOT use) | ✅ Correct (live app) |
|---------|---------------------|------------------------|
| Background | Dark `#0B0F14` | Warm cream `#F6F3EE` |
| Cards | Dark slate `#151B23` | Paper white `#FEFDFB` |
| Primary accent | Teal `#14B8A6` | **Coral `#E0632B`** |
| Soft highlight | Teal tint | Coral soft `#FCE8DE` |
| Headings font | Inter | **Fraunces** (serif display) |
| Body font | Inter | **Space Grotesk** |
| Heading color | White | Dark ink `#252836` |
| Body muted | `#94A3B8` on dark | `#7A7F8E` on light |
| Secondary accent | — | Indigo `#6366F1` (sparingly) |
| Success / leaf | — | `#22A85A` |

**Rule:** When you demo the app after the slides, judges should feel the deck and the product are the **same brand**.

---

## Section 2 — Global design block (prepend mentally to every prompt)

Every slide prompt below **already includes** this design system. If Gemini ignores it, use the **Universal color-fix prompt** in Section 3.

```
GLOBAL DESIGN — Community Hero live app (LIGHT theme):

ORIENTATION: 16:9 widescreen landscape only.

BACKGROUND: Warm cream #F6F3EE — never dark, never pure white #FFFFFF.
Optional subtle radial glows: soft coral #E0632B at top-left (10% opacity),
soft indigo #6366F1 at top-right (8% opacity), like a mobile app landing page.

CARDS / PANELS: Off-white paper #FEFDFB, border #E8E4DE, soft shadow
(0 10px 30px rgba(37,40,54,0.08)), rounded corners ~18px.

PRIMARY ACCENT: Coral #E0632B — titles highlights, icons, arrows, CTAs,
key statistics, slide numbers, URLs. NEVER use teal #14B8A6.

CORAL SOFT: #FCE8DE — badge backgrounds, stat banners, highlight boxes.

TEXT:
- Headings: #252836, font Fraunces (serif display, bold)
- Body: #252836, font Space Grotesk or clean geometric sans
- Muted / secondary: #7A7F8E
- On coral buttons: white #FEFDFB text

SECONDARY ACCENT: Indigo #6366F1 — map/AI secondary icons only, sparingly.

SEVERITY (if needed): Low #22A85A · Medium #EAB308 · High #E0632B · Critical #DC2626

FOOTER (every slide): Left — small gray "community-hero · Vibe2Ship 2026 · PS2"
Right — slide number in coral.

STYLE: Warm civic product launch. Premium, airy, minimal. NOT dark hackathon.
NOT academic thesis. Max 6 bullets per slide. No paragraph walls.
No stock photos of people. Use icons, diagrams, placeholders.

PLACEHOLDERS: Dashed gray boxes labeled clearly for user to insert later.
```

---

## Section 3 — Universal prompts (use anytime)

### 3A — Universal color-fix prompt (Edit this slide)

Use when any slide came out dark, teal, or off-brand:

```
Edit this slide only. Restyle to match the LIVE Community Hero mobile app.

MANDATORY CHANGES:
- Background → warm cream #F6F3EE (remove any dark/black/navy background)
- All teal #14B8A6 or green-blue accents → coral #E0632B
- Dark card panels → paper white #FEFDFB with soft shadow and border #E8E4DE
- White text on dark → dark ink #252836 for headings, #7A7F8E for body
- Headings → Fraunces serif bold
- Body → Space Grotesk
- Add subtle coral glow top-left corner (very faint)
- Footer: gray "community-hero · Vibe2Ship 2026 · PS2" + coral slide number

DO NOT change any wording, bullet text, or layout structure — colors and fonts only.
DO NOT use dark theme. DO NOT use teal anywhere.
```

### 3B — Universal spacing fix (Edit this slide)

```
Edit this slide only. Keep all text and colors identical.
Improve: alignment to consistent 48px margins, equal column widths,
more whitespace between sections, no overlapping text,
no text smaller than 14pt body / 28pt titles.
Ensure footer is visible and not cut off.
```

### 3C — Universal “remove clutter” (Edit this slide)

```
Edit this slide only. Remove decorative clip art, extra icons, and duplicate titles.
Keep maximum 6 bullet points. Keep coral #E0632B accent and cream #F6F3EE background.
Make the slide look like a clean Apple/Google product keynote slide.
```

---

## Section 4 — Deck overview (7 slides)

| # | Title | Time | Purpose |
|---|-------|------|---------|
| 1 | Title + thesis | 0:20 | Hook, brand, live URL |
| 2 | Dilemma & gap | 0:55 | Problem + Swachhata comparison |
| 3 | Solution + journey | 1:00 | 4 pillars + pipeline |
| 4 | 6-agent orchestration | 0:45 | Agentic depth (20% criteria) |
| 5 | Live demo | 3:30 | QR + demo script |
| 6 | Impact + Google stack | 0:45 | Metrics + jury mapping |
| 7 | Close + links | 0:45 | Memorable quote, Q&A |

**Total:** ~8:00  

---

## Slide 1 — Title + thesis

### When to use
- **Create new slide** on a blank presentation (first slide).

### Full generation prompt (copy everything below)

```
Create SLIDE 1 — Title slide for Community Hero hackathon jury presentation.

=== GLOBAL DESIGN ===
16:9 widescreen. LIGHT theme only.
Background: warm cream #F6F3EE with faint coral glow top-left, faint indigo glow top-right.
Cards: paper #FEFDFB, border #E8E4DE, soft shadow.
Primary accent: coral #E0632B — NEVER teal, NEVER dark background.
Headings: Fraunces serif bold #252836. Body: Space Grotesk. Muted: #7A7F8E.
Footer left: "community-hero · Vibe2Ship 2026 · PS2". Footer right: "1" in coral.

=== LAYOUT ===
- Left 60%: all text content, vertically centered
- Right 40%: large dashed placeholder rectangle, rounded corners, gray label:
  "APP SCREENSHOT — insert Landing page from phone"
- Optional: small coral pill badge below tagline: "LIVE ON CLOUD RUN"

=== CONTENT (exact text) ===
Line 1 (small coral uppercase, letter-spaced):
  VIBE TO SHIP 2026 · PROBLEM STATEMENT 2

Line 2 (Fraunces, very large, dark ink):
  Community Hero

Line 3 (coral, medium-large):
  CIVICPULSE AI

Line 4 (dark, italic):
  Photo → AI → Map → Community verify → Named resolution

Line 5 (gray, regular):
  Citizen photos become public, routed, verifiable civic records —
  live on Google Cloud Run today.

Line 6 (small dark):
  Ojas Srivastava · Solo builder · Full-stack + AI agents

Line 7 (coral, clickable style):
  community-hero-987477089222.asia-south1.run.app

=== DO NOT ===
- Do not use dark background
- Do not use teal #14B8A6
- Do not add evaluation criteria or hackathon rules text
- Do not use stock photos of people
```

### Edit prompt if layout is wrong

```
Edit slide 1. Move all text to left side. Put one large screenshot placeholder on right.
Title "Community Hero" must be the largest text (Fraunces). Keep cream background and coral accents.
```

### Manual steps after generation
- [ ] Insert phone screenshot of Landing page (`/` route) into right placeholder  
- [ ] Confirm URL is readable from back of room  

### Speaker notes (0:20)
> "Community Hero turns a citizen's photo into a public, routed, verifiable civic record — and it's live on Cloud Run today, not slideware."

---

## Slide 2 — The dilemma & the gap

### When to use
- **Create new slide** (slide 2).

### Full generation prompt

```
Create SLIDE 2 — Problem and gap slide for Community Hero hackathon deck.

=== GLOBAL DESIGN ===
16:9. LIGHT theme. Background cream #F6F3EE. Coral accent #E0632B only.
Paper cards #FEFDFB with soft shadow. Fraunces headings, Space Grotesk body.
Footer: community-hero · Vibe2Ship 2026 · PS2 | slide 2 in coral.

=== LAYOUT ===
- Title bar full width at top
- Three equal-width columns below, each inside a paper card with rounded corners
- Full-width stat banner at bottom inside coral-soft #FCE8DE background

=== TITLE ===
Civic reporting is broken — demand exists, intelligence doesn't
(Fraunces, dark #252836, with word "broken" or "intelligence" in coral)

=== COLUMN 1 — card header "The Dilemma" (dark) ===
• Have you reported a pothole and never heard back?
• WhatsApp groups, municipal portals, ad-hoc apps — no shared record
• Duplicate photos of the same leak waste field crews

=== COLUMN 2 — card header "What Exists" (dark) ===
• Swachhata — 4,000+ cities, proved citizen demand
• FixMyStreet — mature UX, no Gemini vision or agents
• Manual municipal desks — slow triage

=== COLUMN 3 — card header "The Gap" (coral) ===
• No sub-3-second AI classification at submit
• No agentic routing + SLA + dedup pipeline
• No public timeline: submitted → assigned → resolved

=== BOTTOM STAT BANNER ===
Large coral number/text: Millions of urban complaints every year
Gray subtext: Opacity is the default — we fix speed, routing, and accountability

=== RULES ===
Max 3 bullets per column. No dark theme. No teal. Clean hackathon comparison layout.
```

### Edit prompt if columns are uneven

```
Edit slide 2. Make three columns exactly equal width with identical card heights.
Keep all bullet text unchanged. Cream background, coral accents only.
Stat banner spans full width at bottom with coral-soft #FCE8DE fill.
```

### Manual steps
- [ ] Optional: small pothole icon or map pin icon in column 1 (coral line icon)  

### Speaker notes (0:55)
> "Have you ever reported something and never heard back? Swachhata proved demand at 4,000+ cities — but nobody combines sub-3-second Gemini triage, six agents, and a public resolution timeline. That's the gap we fill."

---

## Slide 3 — Solution + citizen journey

### When to use
- **Create new slide** (slide 3).

### Full generation prompt

```
Create SLIDE 3 — Solution and citizen journey for Community Hero.

=== GLOBAL DESIGN ===
16:9 light cream #F6F3EE, coral #E0632B accent, paper cards #FEFDFB.
Fraunces titles, Space Grotesk body. Footer slide 3.

=== LAYOUT ===
TOP: Title + subtitle
MIDDLE: Four equal pillars in a row, each with simple line icon + title + one line
BOTTOM: Horizontal pipeline flowchart with coral arrows between 7 steps
BOTTOM-RIGHT: Coral pill badge

=== TITLE (Fraunces, dark) ===
Community Hero — production on Cloud Run

=== SUBTITLE (gray) ===
All 8 official Vibe2Ship features shipped

=== FOUR PILLARS (icon above each) ===
1. 3s AI Triage
   Gemini Vision → category, severity, department

2. 6-Agent Pipeline
   Route, SLA, dedup, priority — no manual desk

3. Community Verify
   Boost tiers cut ~40% duplicate noise

4. Public Accountability
   Timeline + proof photo + Open311 export

=== PIPELINE (horizontal boxes, coral arrows) ===
Photo + GPS → Gemini → Firestore → Map → Boost → Community Verified → Resolved

=== BADGE (coral pill, white text) ===
8/8 features · Live demo next

=== RULES ===
Pipeline must be readable in one glance. No dark theme. No teal.
Icons: camera, spark/AI, users, checkmark — simple line style in coral.
```

### Edit prompt if pipeline is vertical

```
Edit slide 3. Make the pipeline flowchart strictly HORIZONTAL across the bottom
with left-to-right coral arrows. Four pillars in one row above it.
Keep all text. Light cream background.
```

### Manual steps
- [ ] Optional: replace bottom area with `docs/diagrams/png/05-report-intake-sequence.png`  

### Speaker notes (1:00)
> "Four pillars: 3-second AI triage, six agents, community verification, public accountability. Same engineering rigor as enterprise logistics — mission is communities, not cargo. All eight official features ship in production."

---

## Slide 4 — 6-agent orchestration

### When to use
- **Create new slide** (slide 4).

### Full generation prompt

```
Create SLIDE 4 — Agentic AI architecture for Community Hero hackathon deck.

=== GLOBAL DESIGN ===
16:9 cream #F6F3EE, coral #E0632B, paper panels #FEFDFB.
Fraunces + Space Grotesk. Footer slide 4. LIGHT theme only.

=== LAYOUT ===
Split slide:
- LEFT 55%: large dashed placeholder box, label inside:
  "AGENT WORKFLOW DIAGRAM — insert 04-agent-workflow.png"
- RIGHT 45%: title, subtitle, 4 bullet points

=== RIGHT SIDE CONTENT ===
Title (coral): 6-Agent Orchestration — not one mega-prompt

Subtitle (gray): Agentic Depth · 20% of jury criteria

Bullets (dark text, coral bold keywords):
• Six discrete agents in auditable code — Vision, Routing, SLA, Dedup, Priority, Gamification
• Low confidence → Draft review queue (human-in-the-loop)
• Geohash dedup → duplicate merge suggestions (~40% reduction)
• Vision runs pre-submit; routing uses deterministic department map

Bottom note (small gray):
Single Cloud Run container · Express API + React PWA · GitHub open source

=== RULES ===
Exactly 4 bullets on right. Diagram placeholder dominates left side.
Technical but clean — NOT academic. No dark background. No teal.
```

### Edit prompt if too much text

```
Edit slide 4. Reduce right column to exactly 4 bullet points.
Enlarge the left diagram placeholder to 55% of slide width.
Keep coral accents and cream background.
```

### Manual steps
- [ ] Insert image: `docs/diagrams/png/04-agent-workflow.png` into left placeholder  
- [ ] Verify diagram readable on projector  

### Speaker notes (0:45)
> "This is what scores Agentic Depth — six discrete agent functions, not one mega-prompt. Low confidence routes to a Draft queue. Geohash dedup cuts duplicates. Every branch is auditable on GitHub."

---

## Slide 5 — Live demo

### When to use
- **Create new slide** (slide 5). **Most important slide for demo transition.**

### Full generation prompt

```
Create SLIDE 5 — Live demo slide for Community Hero hackathon presentation.

=== GLOBAL DESIGN ===
16:9 cream #F6F3EE, coral #E0632B accents, paper card #FEFDFB.
Fraunces title, Space Grotesk body. Footer slide 5. LIGHT theme.

=== LAYOUT ===
- CENTER: largest element — dashed square placeholder with coral border (3px),
  label: "QR CODE — insert qr-production.png"
- Below QR: full URL in coral, large readable font
- Below URL: coral pill badge
- LEFT SIDE: compact numbered demo script (7 steps, small gray text)
- TOP: title centered or left-aligned

=== CONTENT ===
Title (Fraunces, dark): Live Demo — follow along

URL (coral, bold, large):
community-hero-987477089222.asia-south1.run.app

Badge (coral background, white text):
Submit without login — no personal data required

DEMO SCRIPT (left column, numbered, gray #7A7F8E):
1. Landing → Submit without login
2. Map → filter Pothole → open issue
3. Issue → Boost → agent stepper + SLA
4. Report → photo → AI Analyze → submit
5. Dashboard → charts + hotspot
6. Assistant → "What potholes are near me?"
7. Admin → mark In Progress

Bottom center (dark): 3:30 live walkthrough · incognito phone recommended

=== RULES ===
QR placeholder must be the visual focal point — largest on slide.
No dark theme. No teal. Minimal decoration.
```

### Edit prompt if QR area is too small

```
Edit slide 5. Make the QR code placeholder the largest element — at least 35% of slide height,
centered. Demo script stays on left in small text. URL directly under QR in coral.
Keep cream background.
```

### Manual steps
- [ ] Insert `docs/demo/qr-production.png` into center placeholder  
- [ ] Test QR scan from 3 meters before presenting  
- [ ] Pre-open incognito tab on phone to production URL  

### Speaker notes (3:30 demo — see Section 10 for full script)
> "Follow the QR — you can submit without login, no personal data. I'll walk the full citizen-to-admin loop in three and a half minutes."

---

## Slide 6 — Impact + Google technologies

### When to use
- **Create new slide** (slide 6).

### Full generation prompt

```
Create SLIDE 6 — Impact metrics and Google technologies for Community Hero.

=== GLOBAL DESIGN ===
16:9 cream #F6F3EE, coral #E0632B, paper panels #FEFDFB.
Fraunces title, Space Grotesk. Footer slide 6. LIGHT theme only.

=== LAYOUT ===
Full-width title at top.
Two equal columns below, each in a paper card.

=== TITLE (Fraunces, dark) ===
Measurable impact · Built on Google

=== LEFT COLUMN — header "Design targets" (coral) ===
Four metric rows — bold coral number on left, description on right:
80% faster — triage vs manual municipal forms
~40% — duplicate reduction (geohash + community verify)
<3 sec — vision analyze latency
100% — issues have public status timelines

Small gray footnote under table:
Design targets validated on demo ward + architecture

=== RIGHT COLUMN — header "Google stack" (coral) ===
2×3 grid of simple icons + name + one line each:
• Gemini 2.5 Flash — report wizard, civic assistant, insights
• Firebase Auth — secure API sessions
• Cloud Firestore — realtime issues + geohash queries
• Cloud Storage — report & proof images
• Google Maps Platform — explorer + geocoding
• Cloud Run + AI Studio — prototype → production deploy

=== RULES ===
Numbers must pop in coral. No paragraph text. No dark theme. No teal.
Balanced two-column layout.
```

### Edit prompt if table is cramped

```
Edit slide 6. Widen both columns equally. Make metric numbers (80%, 40%, 3 sec, 100%)
extra large in coral #E0632B. Google stack as clean 2x3 icon grid, not a paragraph list.
```

### Speaker notes (0:45)
> "Eighty percent faster triage, forty percent fewer duplicates, sub-three-second vision — design targets on our demo ward. Built entirely on Google: Gemini, Firebase, Maps, Cloud Run. You saw every one of these in the demo."

---

## Slide 7 — Closing

### When to use
- **Create new slide** (slide 7). Final slide judges remember.

### Full generation prompt

```
Create SLIDE 7 — Closing slide for Community Hero hackathon jury presentation.

=== GLOBAL DESIGN ===
16:9 cream #F6F3EE with subtle centered coral radial glow behind quote.
Coral #E0632B accents. Fraunces for quote, Space Grotesk for links.
Footer slide 7. LIGHT cinematic minimal layout.

=== LAYOUT ===
Centered vertical stack. Generous whitespace. No clutter.

=== CONTENT ===
Large centered quote (Fraunces, dark #252836, 32-36pt, bold):
"Every pothole deserves a public record and a named resolution."

Three link rows (coral label + dark URL), centered:
Live App → community-hero-987477089222.asia-south1.run.app
GitHub → github.com/Ojas-Srivastava05/community-hero
Google Doc → [ADD PUBLIC LINK BEFORE SUBMIT]

Gray centered line:
Open source · Live today · Thank you — questions?

Small bottom credit:
Ojas Srivastava

=== RULES ===
Quote is the hero element. Maximum visual impact. No bullet lists.
No dark theme. No teal. Keep visible during Q&A.
```

### Edit prompt if quote is too small

```
Edit slide 7. Make the quote the largest text on the slide (minimum 32pt Fraunces bold).
Center everything. Add faint coral glow halo behind quote only.
Links below in two lines each, coral labels. Cream background.
```

### Manual steps
- [ ] Add Google Doc public view link before BlockseBlock submit  
- [ ] Keep this slide visible during Q&A  

### Speaker notes (0:45)
> "Every pothole deserves a public record and a named resolution. Open source, live today — happy to walk agents, Firestore rules, or Open311 export in Q&A."

---

## Slide 8 — Backup: System architecture (Q&A)

### When to use
- **Create new slide** — optional, hide until Q&A.

### Full generation prompt

```
Create BACKUP SLIDE 8 — System architecture (Q&A only) for Community Hero.

LIGHT theme cream #F6F3EE, coral #E0632B, paper #FEFDFB. Fraunces + Space Grotesk. Footer slide 8.

Title: System Architecture

Center: large dashed placeholder "Insert 01-system-architecture.png"

Caption bullets below diagram (max 5):
• React 19 PWA + Vite + Tailwind (client)
• Express 5 API + 6-agent pipeline (Cloud Run)
• Cloud Firestore + Firebase Storage + Firebase Auth
• Gemini 2.5 Flash (vision, assistant, insights)
• Single Cloud Run service · asia-south1 · Docker + GitHub Actions

Clean, technical, light background. No teal.
```

### Manual steps
- [ ] Insert `docs/diagrams/png/01-system-architecture.png`  

---

## Slide 9 — Backup: Technology stack (Q&A)

### Full generation prompt

```
Create BACKUP SLIDE 9 — Technology stack table for Community Hero Q&A.

LIGHT cream #F6F3EE, coral headers #E0632B, paper table rows #FEFDFB.
Title: Technology Stack. Footer slide 9.

Clean 2-column table (Layer | Technology):
Frontend | React 19, Vite, Tailwind, Framer Motion, Recharts
Backend | Node.js, Express 5, Zod, Multer
Database | Cloud Firestore
Storage | Firebase Cloud Storage
Auth | Firebase Authentication (Google)
AI | Gemini API (@google/generative-ai)
Maps | Google Maps Platform
Deploy | Cloud Run asia-south1, Docker, GitHub Actions

Alternating row shading #FCE8DE / #FEFDFB. No dark theme.
```

---

## Slide 10 — Backup: Product screenshots (Q&A)

### Full generation prompt

```
Create BACKUP SLIDE 10 — Product screenshot gallery for Community Hero Q&A.

LIGHT cream background, coral title, paper screenshot frames.
Title: Civic Glass UI — mobile-first (footer slide 10)

2×3 grid of dashed placeholders labeled:
Landing | Report Wizard | Map Explorer
Issue Detail | Dashboard | Leaderboard

Small note bottom: Dark ink #252836 text on cream — matches live production app
```

### Manual steps
- [ ] Capture 6 screenshots from production URL in incognito  

---

## Slide 11 — Backup: Competitive comparison (Q&A)

### Full generation prompt

```
Create BACKUP SLIDE 11 — Competitive comparison for Community Hero Q&A.

LIGHT cream #F6F3EE, coral #E0632B for Community Hero column highlight.
Title: Why Community Hero wins. Footer slide 11.

Table 4 columns × 4 rows:
Header row: Feature | Swachhata | FixMyStreet | Community Hero

Rows:
Scale / adoption | ✓ 4000+ cities | ✓ Mature | ✓ Multi-city demo
AI triage (<3s) | ✗ | ✗ | ✓ Gemini Vision
6-agent pipeline | ✗ | ✗ | ✓
Public timeline + verify | Partial | ✓ | ✓ + boosts + Open311

Community Hero column: coral checkmarks, light coral-soft column background #FCE8DE.
```

---

## Section 5 — Post-generation master checklist

| Step | Action |
|------|--------|
| 1 | All 7 slides use cream background — run color-fix on any dark slide |
| 2 | No teal anywhere — all accents coral |
| 3 | Slide 1: Landing screenshot inserted |
| 4 | Slide 4: agent workflow PNG inserted |
| 5 | Slide 5: QR code inserted and tested |
| 6 | Slide 7: Google Doc link added |
| 7 | Footer consistent on every slide |
| 8 | Presenter View: speaker notes added from Section 10 |
| 9 | Export PDF backup to Google Drive |
| 10 | Rehearse full 8:00 timed run twice |

---

## Section 6 — Image assets reference

| Asset | Path | Used on |
|-------|------|---------|
| QR code | `docs/demo/qr-production.png` | Slide 5 |
| Agent workflow | `docs/diagrams/png/04-agent-workflow.png` | Slide 4 |
| System architecture | `docs/diagrams/png/01-system-architecture.png` | Slide 8 |
| Report sequence | `docs/diagrams/png/05-report-intake-sequence.png` | Slide 3 (optional) |
| Landing screenshot | Capture from live app | Slide 1 |
| Demo script detail | `docs/demo/APPENDIX-I-DEMO-SCRIPT.md` | Rehearsal |

---

## Section 7 — Full 8-minute speaker script

```
[0:00 SLIDE 1]
"Community Hero — citizen photo to accountable civic record. Live on Cloud Run today."

[0:20 SLIDE 2]
"Have you reported a pothole and never heard back? Swachhata proved demand.
The gap is AI speed, agentic routing, and public transparency."

[1:15 SLIDE 3]
"Four pillars: 3-second triage, six agents, community verify, public timeline.
All eight Vibe2Ship features shipped."

[2:15 SLIDE 4]
"Six discrete agents — not one prompt. Draft queue for low confidence.
Auditable on GitHub."

[3:00 SLIDE 5 — START DEMO]
"Scan the QR. Submit without login — no personal data."

  Demo steps (3:30):
  · Submit without login
  · Map → pothole → issue detail → boost
  · Report → AI analyze
  · Dashboard hotspot
  · Assistant question
  · Admin in progress

[6:30 SLIDE 6]
"80% faster triage, 40% fewer dupes, sub-3-second AI.
Built on Gemini, Firebase, Maps, Cloud Run."

[7:15 SLIDE 7]
"Every pothole deserves a public record and a named resolution.
Open source, live today — questions?"

[8:00 STOP]
```

---

## Section 8 — Troubleshooting Gemini slide generation

| Problem | Fix |
|---------|-----|
| Dark background appeared | Paste **Universal color-fix prompt** (Section 3A) |
| Teal instead of coral | Same color-fix prompt; say "replace ALL teal with coral #E0632B" |
| Too much text | Section 3C clutter prompt + ask to reduce to 6 bullets |
| Wrong fonts | Edit: "Headings Fraunces serif, body Space Grotesk" |
| Columns uneven | Slide-specific edit prompt in each section |
| QR too small | Slide 5 edit prompt |
| Generated extra slides | Delete manually; Gemini one-slide mode should not add agenda/TOC |
| Colors OK but bland | Add: "subtle coral radial glow top-left, premium product keynote style" |

---

## Section 9 — Jury criteria mapping (what to emphasize while presenting)

| Criterion | Weight | Slide | Demo moment |
|-----------|--------|-------|-------------|
| Impact | 20% | 2, 6 | Dashboard hotspot |
| Agentic depth | 20% | 4 | Issue detail agent stepper |
| Innovation | 20% | 3 | Boost + dedup + assistant |
| Google tech | 15% | 6 | Gemini analyze live |
| Product experience | 10% | 1, 5 | Submit without login |
| Technical | 10% | 4, 8 | GitHub mention |
| Completeness | 5% | 3, 5 | Admin resolve step |

---

## Section 10 — Quick reference: copy-paste order

1. Slide 1 prompt → create  
2. Slide 2 prompt → create  
3. Slide 3 prompt → create  
4. Slide 4 prompt → create  
5. Slide 5 prompt → create  
6. Slide 6 prompt → create  
7. Slide 7 prompt → create  
8. Color-fix any slide that looks wrong  
9. Insert QR + screenshots + diagrams  
10. Optional slides 8–11 for Q&A  

---

*Generated for Community Hero · Vibe2Ship 2026 · Colors aligned with `frontend/src/index.css` (coral + cream light theme).*
