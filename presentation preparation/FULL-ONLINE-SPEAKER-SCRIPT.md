# Community Hero — Full Online Presentation Script

**Event:** Vibe to Ship (Vibe2Ship) / BlockseBlock 2026 · Problem Statement 2  
**Deck path:** Slides 1 → 2 → 3 → 4 → 5 → 6 (live demo) → 7 → 11 (~8 minutes)  
**Live app:** https://community-hero-987477089222.asia-south1.run.app

**How to use:** Read naturally — you don't need to memorize every word. Bracketed lines like `[Show Slide 1]` are stage directions, not spoken aloud.

---

## Memorize these two lines

**Open (Slide 1):**

> CIVICPULSE AI is our platform — Community Hero is the live app. A citizen photo becomes a public, routed, verifiable record — deployed on Cloud Run today.

**Close (Slide 11):**

> Report once. Track in public. Resolve with proof.

---

## Pre-start checklist (do not say aloud)

- Mic check, camera on, notifications off
- Tab 1: Google Slides (fullscreen)
- Tab 2: Live app (incognito)
- Tab 3: Admin / “Enter as demo authority” if needed
- Paste live URL in meeting chat before you begin
- Clicker or keyboard ready on Slide 1

---

## Slide 1 — Title (~30 seconds)

**[Show Slide 1 — landing screenshot + live URL]**

> Good morning, everyone. I'm **Ojas Srivastava**, and this is **CIVICPULSE AI** — our platform — and **Community Hero**, the live product built for **Vibe to Ship, Problem Statement 2**.
>
> In one line: **a citizen takes a photo, and that photo becomes a public, routed, verifiable civic record** — not a message lost in a WhatsApp group.
>
> If you look at the flow on this slide — **Photo, AI, Map, Verify, Resolution** — that's the entire journey we shipped.
>
> And this is not a mockup. **Community Hero is live on Google Cloud Run right now.** I've put the link in chat — you can follow along on your phone while I present.

**[Paste in chat if not already:]**

`https://community-hero-987477089222.asia-south1.run.app`

**[Advance to Slide 2]**

---

## Slide 2 — Problem (~45 seconds)

**[Point at left column, then middle, then right]**

> Let me make this personal. You see a pothole on your street. You report it somewhere — a municipal portal, a WhatsApp group, maybe you call someone. **And then… silence.** You never know if anyone saw it, who owns it, or when it gets fixed.
>
> On the left: the **citizen dilemma** — fragmented channels, duplicate photos of the same leak, zero accountability.
>
> In the middle: **what already exists.** Apps like **Swachhata** proved Indians *will* report civic issues at massive scale — thousands of cities. **FixMyStreet** showed how good map-based UX can feel. But they weren't built for **sub-three-second AI triage** or **agentic routing**.
>
> On the right: the **gap we're filling** — no fast vision classification, no automated department routing with SLA deadlines, no duplicate detection, and **no public timeline** that citizens can actually trust.
>
> The banner says it simply: **millions of complaints every year, and opacity is the default.** We fix **speed** and **accountability**.

**[Advance to Slide 3]**

---

## Slide 3 — Solution (~45 seconds)

**[Walk the journey banner left to right]**

> Here's how Community Hero solves that — and we've implemented **all eight official Vibe2Ship features** in production.
>
> **Step one:** a citizen snaps a photo. GPS attaches automatically.
>
> **Step two:** **Gemini Vision** classifies the issue in under three seconds — category, severity, safety risk.
>
> **Step three:** the report lands in **Firestore** — our database — and appears on the **live map**.
>
> **Step four:** neighbours **upvote** to verify — this is real community signal, not AI pretending to verify.
>
> **Step five — important:** **Boost means neighbours verify**, not the AI boosting itself.
>
> **Steps six and seven:** the issue moves through **Assigned → In Progress → Resolved**, with a **proof photo** and a **public timeline** everyone can see.
>
> The three cards at the bottom are our pillars: **AI triage**, **community verification**, and **public closure** — including **Open311 export** so municipalities aren't locked in.

**[Advance to Slide 4]**

---

## Slide 4 — Six agents (~45 seconds)

**[Point at the agent diagram — hub and branches]**

> This is where we score on **agentic depth**. Community Hero doesn't use one giant ChatGPT prompt. It runs **six discrete agents** on every submission.
>
> **Vision** classifies the photo. **Routing** picks the right department — Roads, Water, Waste — from a deterministic map, so it's auditable. **SLA** sets a resolution deadline from severity. **Dedup** uses geohash neighbours to cut duplicate noise — we target roughly **forty percent fewer duplicates**. **Priority** scores what field crews should see first. And **Gamification** awards civic points when people participate ethically.
>
> See this branch? **Low confidence** doesn't go public — it goes to a **Draft / Judge review queue** for a human before citizens see it.
>
> Everything runs **server-side** in one **Cloud Run** container — frontend, API, and agents — and it's all **open source on GitHub** if you want to audit the code.

**[Advance to Slide 5]**

---

## Slide 5 — Authority console (~30 seconds)

**[Point at admin screenshot]**

> Citizens report — but **authorities close the loop**. This is the **Authority Console**.
>
> Ops teams get a **Judge queue** for low-confidence AI reports, tabs for dispatch and SLA breaches, and a one-click path to mark **In Progress** and **Resolved with proof photo**.
>
> The tagline matters: **AI triages — humans decide — and every action leaves an audit trail.**
>
> We also support **multi-city demo data** with a voluntary region filter — Bengaluru, Delhi, Mumbai, and more — because this isn't a single-ward toy app.

**[Advance to Slide 6 — stay on slide during demo]**

---

## Slide 6 — Live demo (~3 minutes)

**[Screen-share switches to browser — slide 6 visible in corner or full screen to app]**

> I'm going to show you the live product now. Same URL in chat — feel free to open it on your phone. **You can submit a test report without logging in** — no personal data required for the demo.

### Demo beat 1 — Landing + submit without login (~25 sec)

**[Go to `/`]**

> This is the **citizen home** — live stats, trending issues near you. Watch the **Live** indicator — data is real-time from Firestore.
>
> I'll tap **Submit without login** — privacy-first: one tap, no signup wall for reporting.

**[Tap Submit without login or go to `/report`]**

### Demo beat 2 — Map (~25 sec)

**[Go to `/map`]**

> Here's the **Map Explorer** — geotagged issues, **severity colours**, hotspot clusters with counts. Tap **Bengaluru** to see all demo issues in that city… open an issue… you can see department, ward, and verification level.
>
> The badge shows how many issues are loaded — this is live data from our database.

**[Tap a city chip, then tap an issue — show preview card or bottom list]**

### Demo beat 3 — Issue detail + community verify (~25 sec)

**[Open `/issues/:id`]**

> On the issue page — scroll to the **agent stepper**: Vision, Routing, SLA, Dedup — visible to citizens, not hidden in the backend.
>
> I'll hit **Boost** — that's a neighbour upvote. At **one, three, and ten** upvotes, verification tiers kick in. **Community verifies the issue — not the AI.**

**[Tap Boost if logged in, or point at upvote count on seeded issue]**

### Demo beat 4 — Report wizard + AI (~45 sec)

**[Go to `/report`]**

> New report — **three steps**. I'll upload a pothole photo… tap **Analyze with AI**…
>
> **[Wait for Gemini]** There — in about **three seconds**: category, severity, title, description, department — all prefilled. I confirm the map pin… **Submit**.
>
> That one action triggered the **six-agent pipeline** on the server. The new issue will appear on the map for everyone.

**[Submit — optionally show success / issue page]**

### Demo beat 5 — Dashboard (~25 sec)

**[Go to `/dashboard`]**

> **Impact dashboard** — open vs resolved KPIs, department SLA compliance, **hotspot map**, thirty-day trends. This is how a municipal commissioner sees **where to deploy crews before complaints spike** — predictive, not just reactive.

### Demo beat 6 — Civic assistant (~25 sec)

**[Go to `/assistant`]**

> **Civic AI assistant** — natural language over **live issue data**. I'll ask: *"What open potholes are near me?"*
>
> It's not hallucinating — it's calling our API with **function calling** on real Firestore records.

**[Type/send query — show response]**

### Demo beat 7 — Authority action (~15 sec)

**[Switch to admin tab — `/admin`]**

> Back to authorities — I'll mark an issue **In Progress**… done. Citizens see that on the **public timeline** immediately. **Report once. Track in public. Resolve with proof.**

**[Return to slides — Slide 7]**

---

## Slide 7 — Impact + Google stack (~40 seconds)

**[Show Slide 7]**

> To close the technical story: this is **shipped software**, not slideware.
>
> We have **fifty-plus seeded issues across five cities**, **sub-three-second vision classification**, **six agents on every submission**, and a full **public status timeline** on every issue.
>
> Built entirely on **Google**: **Gemini** for vision and chat, **Firebase Auth** and **Firestore**, **Cloud Storage** for photos, **Google Maps** for the explorer, **Cloud Run** in **asia-south1** for production hosting — plus the **AI Studio → export → deploy** path.
>
> We also export **Open311** for municipal interoperability — same standard as mature civic platforms.

**[Skip Slides 8–10 unless Q&A — go to Slide 11]**

---

## Slide 11 — Close (~25 seconds)

**[Show Slide 11 — punchline + links]**

> I'll leave you with this:
>
> **"Report once. Track in public. Resolve with proof."**
>
> **Community Hero** turns citizen photos into **accountable, routed, verifiable** civic records — with **AI speed**, **agent depth**, and **community trust**.
>
> Everything is live today:
>
> - **App:** community-hero on Cloud Run
> - **Code:** GitHub — fully open source
> - **Android APK** available for install
>
> Thank you. I'm happy to go deep on **agents, Firestore rules, or the demo** in Q&A.

**[Stop. Leave slide up with links during Q&A]**

---

## Q&A backup lines

**"Why not just use Swachhata?"**

> Swachhata proved participation at national scale. We add **sub-three-second AI triage**, **six-agent routing and SLA**, **predictive hotspots**, and **Open311 export** — it's the next layer on top of citizen willingness to report.

**"How is AI used beyond a chatbot?"**

> Six **deterministic agents** on every submit — vision, routing, SLA, dedup, priority, gamification — with a **confidence gate** to human review. Not one mega-prompt.

**"Is it production-ready?"**

> Live on Cloud Run with **CI/CD**, **rate limits**, **Firestore security rules**, health checks, and a **19-phase verification script**. You can hit `/api/health` right now.

**"Why two names — CIVICPULSE AI and Community Hero?"**

> **CIVICPULSE AI** is the hackathon project name. **Community Hero** is the shipped product — same deployment, same URL.

**"What if the map is empty?"**

> We seed multi-city demo data; the API returns live issues from Firestore. Tap a **city chip** on the map — Bengaluru, Delhi, etc.

**Wi‑Fi / demo fails:**

> The slide gallery and GitHub repo are the **same production build** — identical code path.

---

## One-page timing cheat sheet

| Time | Slide | Focus |
|------|-------|--------|
| 0:00 | 1 | Intro + live URL in chat |
| 0:30 | 2 | Problem — opacity, gap |
| 1:15 | 3 | 7-step journey + 3 pillars |
| 2:00 | 4 | Six agents + draft queue |
| 2:45 | 5 | Authority console |
| 3:15 | 6 | **LIVE DEMO** (7 beats) |
| 6:15 | 7 | Shipped + Google stack |
| 6:55 | 11 | Punchline + thank you |
| **~8:00** | — | **STOP** |

---

## Running over? Cut this first

1. Slide 5 detail (keep tagline only)
2. Gamification on slide 4
3. Demo dashboard + assistant
4. Long Google list on slide 7

**Never cut:** Submit without login · map · boost/stepper · AI classify · closing line

---

## Online presentation tips

1. **Say "link in chat"** at least twice — remote judges may not see your slide URL.
2. **Narrate every click** — "I'm opening Map… tapping Bengaluru… opening this issue."
3. **Pause 2 seconds** after AI analyze — let Gemini finish before you talk over it.
4. **If screen share lags**, stay on slides and describe the beat: "You'd see classification in under three seconds."
5. **Rehearse twice with a timer** — cut dashboard + assistant first if you run long.

---

## Emergency one-liners

| Situation | Say |
|-----------|-----|
| Empty map | "Tap Bengaluru — same architecture, live seeded data." |
| Slow AI | "Sub-3s in prod — here's the classification card." |
| No Wi‑Fi | "Deck gallery + GitHub — identical build." |
| Why two names? | "CIVICPULSE AI = project · Community Hero = live app." |

---

*Rehearse with slides on screen. This script is your full spoken backup — the 8-MINUTE-SPEAKER-SCRIPT is the pocket cue-card version.*
