# Community Hero — Jury Q&A Cheat Sheet (STAR Method)

**Product:** CIVICPULSE AI / Community Hero · **Hackathon:** Vibe2Ship / BlockseBlock 2026  
**Live app:** https://community-hero-987477089222.asia-south1.run.app  
**Use this for:** ~12-minute jury Q&A (expect **8–12 questions**, ~60–90 seconds each)

---

## How to use this document

Each answer follows **STAR**:

| Letter | Meaning | What to say |
|--------|---------|-------------|
| **S** | Situation | Frame the real-world problem or context |
| **T** | Task | What the jury is really asking / what you had to solve |
| **A** | Action | What you built — concrete, technical, honest |
| **R** | Result | Outcome, proof, metric, or limitation |

**Tip:** Lead with the bold **“Say first”** line. If they nod, stop. If they lean in, add Action detail.

**Tags in the index:**

- **[YOU]** — Questions you flagged in prep (Firebase, agents, dedup, SLA, proof, etc.)
- **[JURY]** — Additional high-probability questions judges ask in technical Q&A

---

## Quick index (18 questions — prioritized for 12 min)

### Part A — Your core technical questions [YOU]

| # | Question |
|---|----------|
| Q1 | What exactly do you store in **Firebase** (not Firestore)? |
| Q2 | What exactly do you store in **Firestore**? |
| Q3 | What does the **map** store? Is data saved inside Google Maps? |
| Q4 | How does AI **find garbage / potholes** in an image? |
| Q5 | **Prompt or hardcoded rules?** What do you send on every AI call? |
| Q6 | Explain the **six agents** — what does each one do? |
| Q7 | What does **Dedup** do? |
| Q8 | What is **SLA** and how is it **calculated**? |
| Q9 | How do you verify the **after photo** matches the **original issue**? |
| Q10 | What if I upload a **wrong fix photo** and AI says it’s resolved? |

### Part B — Additional jury questions [JURY]

| # | Question |
|---|----------|
| Q11 | What problem are you solving vs Swachhata / municipal apps? |
| Q12 | Walk me through the product **end-to-end** in 60 seconds. |
| Q13 | What happens when **AI confidence is low**? |
| Q14 | How does **community verification** (upvotes) work? |
| Q15 | How do you stop **spam and fake reports**? |
| Q16 | What if **Gemini is down** or too expensive at scale? |
| Q17 | **Privacy** — what about citizen location and photos? |
| Q18 | Is this **production-ready**? How would a **municipality adopt** it? |

---

# Part A — Your core technical questions

## Q1. [YOU] What exactly do you store in Firebase (not Firestore)?

**Say first:** *“Firebase is the platform — we use Auth for identity, Storage for photos; structured ticket data lives in Firestore.”*

**Situation (S):** Judges say “Firebase” when they mean the whole backend. You need a clean split.

**Task (T):** Name each Firebase product and what binary vs structured data goes where.

**Action (A):**

| Firebase product | What we store |
|------------------|---------------|
| **Firebase Auth** | User UID, email, display name, photo URL; custom claim `{ admin: true }` for authority accounts; Google + demo + guest flows |
| **Cloud Storage** | Report images at `issues/{id}/{uuid}.webp`; resolution proof at `issues/{id}/proof.jpg`; public or signed URLs served to the app |
| **Firestore** | *(separate answer — Q2)* — this is the document database inside Firebase |

We do **not** store issue titles, SLA deadlines, or embeddings in Auth or Storage — only files and identity.

**Result (R):** Three-layer mental model: **who** (Auth), **files** (Storage), **records** (Firestore). Easy to explain in one breath before diving into schema.

---

## Q2. [YOU] What exactly do you store in Firestore?

**Say first:** *“Every civic ticket is one `issues` document plus subcollections for votes, comments, and an audit event log.”*

**Situation (S):** This is the “what’s in your database?” question — expect field-level honesty.

**Task (T):** List collections and the fields that matter for AI, routing, and trust.

**Action (A):**

**`issues` (main document per report):**

- **Citizen input:** `title`, `description`, `category`, `severity`, `lat`, `lng`, `address`, `imageUrls[]`, `reporterId`
- **Workflow:** `status`, `upvoteCount`, `verificationLevel`, `departmentId`, `slaDeadline`, `slaBreached`, `priorityScore`, `proofImageUrl`
- **Geo / search:** `geohash` (precision 7), `wardId`, `embedding` (text vector for dedup)
- **AI envelope:** `aiMetadata.analysis`, `duplicate_suggestions`, `statusNarrative`, `proofComparison`, `needs_review`, `agents[]`

**Subcollections:** `issues/{id}/events` (intake, dedup, routing, proof_comparison…), `votes`, `comments`

**Other top-level:** `users` (points, badges), `departments`, `hotspots`, `notifications`, `threads`, `analytics`

**Security:** Citizens can read issues; **create/update of server fields is API-only** (`firestore.rules`).

**Result (R):** Firestore is the source of truth for everything the map, admin console, and assistant query. Photos are URLs pointing to Storage.

---

## Q3. [YOU] What does the map store? Is data saved inside Google Maps?

**Say first:** *“Google Maps renders pixels — we store coordinates in Firestore; the map just reads them.”*

**Situation (S):** You asked this because it’s easy to confuse the map UI with a database.

**Task (T):** Clarify what persists vs what is drawn live.

**Action (A):**

| Layer | Stored? | Where |
|-------|---------|-------|
| Issue pin lat/lng | **Yes** | Firestore `issues.lat`, `issues.lng` |
| Marker colour (severity) | **Derived** | Computed from `issues.severity` in `CivicMap.tsx` |
| Hotspot rings | **Precomputed** | Firestore `hotspots` (geohash-6 density), optional overlay |
| Cluster bubbles | **No** | Client-side `MarkerClusterer` grouping |
| Draft pin while reporting | **No** | Browser state until submit |
| Google’s map tiles | **Google’s CDN** | We never write civic data there |

Map Explorer fetches issues via API (`preferApi: true`, up to 200 issues) or Firestore listener. City chips filter by `wardId` prefix (`BLR_WARD`, `DEL_WARD`, …).

**Result (R):** If Google Maps API key expired tomorrow, your data is still in Firestore — you’d just lose the canvas.

---

## Q4. [YOU] How does AI find garbage or a pothole in an image?

**Say first:** *“Gemini Vision — we send the photo plus a structured JSON prompt listing Indian civic categories including waste and potholes.”*

**Situation (S):** Judges assume a custom-trained garbage detector. Disabuse that clearly.

**Task (T):** Explain the vision path from shutter click to `category: waste`.

**Action (A):**

1. Client resizes to WebP 1280px (or extracts video keyframes — see rapid fire).  
2. **Intake agent** checks civic/safe content.  
3. **`analyzeImage()`** sends image + hardcoded `ANALYSIS_PROMPT` in `gemini.ts` — explicitly mentions *“garbage dumps, illegal waste dumping, litter piles, potholes…”*  
4. Gemini returns JSON: category, severity 1–5, title, description, department, `confidence` 0–1.  
5. Prompt nudge: *“For obvious illegal dumping use category waste, severity 4–5, confidence 0.9+”*  
6. Optional citizen text appended as `\nContext: {hint}`.  
7. SHA-256 **cache** avoids re-billing identical images.

Model: `gemini-2.5-flash` via Vertex AI in production.

**Result (R):** It’s multimodal LLM classification, not a bespoke CV model — fast to ship, iterates by editing the prompt, gated by confidence threshold 0.7.

---

## Q5. [YOU] Prompt or hardcoded? What do you send on every AI pipeline call?

**Say first:** *“Hardcoded prompts in source code, sent on every call — plus optional citizen context; no fine-tuned weights.”*

**Situation (S):** You wanted to know if classification is magic config or explicit engineering.

**Task (T):** Map each pipeline stage to its exact Gemini input.

**Action (A):**

| Call | Prompt type | Sent each time? |
|------|-------------|-----------------|
| Vision classify | `ANALYSIS_PROMPT` constant + image + optional hint | **Yes** |
| Intake safety | Yes/no appropriateness prompt + image | **Yes** (if image present) |
| Proof compare | Before/after JSON prompt + 2 images | **Yes** (on resolve) |
| Dedup | **No vision** — `text-embedding-004` on title/description | Embedding per new issue |
| Communicator | Template + optional lite-model polish | On status change |
| Assistant chat | `SYSTEM_PROMPT` + tool declarations | Per message; must call tools before facts |

Nothing is “remembered” in the model between reports — each ticket is a fresh API call (except our server-side image cache).

**Result (R):** Fully auditable in `server/src/lib/gemini.ts` and `server/src/lib/agents/`. Judges can ask “show me the prompt” — you can point to the repo.

---

## Q6. [YOU] Explain the six agents — what does each one do?

**Say first:** *“Six sequential steps after submit: gate → classify → dedupe → route → notify → insight.”*

**Situation (S):** “Agentic” is on your slides; this question demands one-line accountability per agent.

**Task (T):** Name, file, input, output for each.

**Action (A):** Orchestrator: `runAgentPipeline()` — `server/src/lib/agents/index.ts`

| Agent | File | Input → Output |
|-------|------|----------------|
| **1. Intake** | `intake.ts` | Image + text → pass/fail civic & safe; fail → `Draft` |
| **2. Vision** | `vision.ts` | Image → `IssueAnalysis` JSON (category, severity, confidence…) |
| **3. Dedup** | `dedup.ts` | Location + text embedding → duplicate suggestions list |
| **4. Routing** | `routing.ts` | Analysis → `departmentId`, `slaDeadline`, `priorityScore` |
| **5. Communicator** | `communicator.ts` | Status + title → EN/HI citizen narrative + notification |
| **6. Insights** | `insights.ts` | Ward/geohash → hotspot context; nightly batch for analytics |

Each writes an `events` subdoc; UI shows `AgentPipelineStepper`.

**Result (R):** Not six separate microservices — six deterministic functions in one pipeline with logged steps. Demo citizen sees the stepper animate on submit.

---

## Q7. [YOU] What does Dedup do?

**Say first:** *“Find same-category reports within 50 metres with 85%+ text similarity — suggest merge, never auto-delete.”*

**Situation (S):** Duplicate tickets waste municipal time; dedup must be real math, not slide copy.

**Task (T):** Explain algorithm and what it does **not** do.

**Action (A):**

1. Encode location → **geohash** (precision 7 stored; query uses precision 6 prefix).  
2. Build text: `category | title | description` → **embedding** (`text-embedding-004`).  
3. Query Firestore: same `category`, geohash range, limit 25.  
4. For each candidate: **haversine distance ≤ 50 m** AND **cosine similarity > 0.85**.  
5. Return top 5 as `aiMetadata.duplicate_suggestions`.  
6. Citizen may **merge** (`mergeIntoId`) → upvote existing issue instead of new ticket.

**Does NOT:** compare pixels; auto-merge; block submit without user consent.

**Result (R):** Cuts “same pothole reported 10 times” noise. Honest limit: two different issues close together with similar wording could be suggested — human chooses.

---

## Q8. [YOU] What is SLA and how is it calculated?

**Say first:** *“SLA is hours-to-deadline from a category × severity table — not AI-generated.”*

**Situation (S):** SLA sounds corporate; show the actual formula and escalation.

**Task (T):** Explain calculation, storage, breach behaviour.

**Action (A):**

**Calculation:** `getSlaHours(category, severity)` → lookup in `shared/types.ts` per department.

Examples:

- `waste` severity **5** → **12 hours**  
- `pothole` severity **1** → **168 hours** (7 days)

**Routing agent sets:** `slaDeadline = now + slaHours`

**Breach:** `now > slaDeadline` and status not Resolved/Closed → `slaBreached: true`, `priorityScore += 25`, `sla_breach` event.

**Priority score** (separate from SLA): 40% severity + 20% upvotes + 30% safety risk + 10% age — capped 0–100.

**Result (R):** Admin queue is sortable by priority and SLA breach. Department scorecards show compliance %. Explainable to a municipal CTO without mentioning ML.

---

## Q9. [YOU] How do you verify the after photo matches the original issue?

**Say first:** *“Gemini compares report photo vs proof photo with a strict JSON prompt — green badge only at 70%+ confidence that it’s improved.”*

**Situation (S):** This is your accountability story — how you prove a fix happened.

**Task (T):** Walk through before/after pipeline and UI gates.

**Action (A):**

1. **Before** = first URL in `imageUrls[0]` (citizen’s original report).  
2. Admin uploads **after** → Cloud Storage → `proofImageUrl`.  
3. `compareBeforeAfter()` sends both images + prompt: *“improved=true only if AFTER clearly shows the reported issue is fixed.”*  
4. Result → `aiMetadata.proofComparison` `{ improved, summary, confidence }`.  
5. UI: **Verified** badge iff `improved && confidence >= 0.7`; else **Mismatch** (amber).  
6. Public **before/after slider** on issue detail page.  
7. Admin can preview via `/verify-resolution` **before** closing ticket.

**Result (R):** Citizens see evidence, not just a status change. Event `proof_comparison` on audit timeline.

---

## Q10. [YOU] What if I upload a wrong fix photo and AI says it’s fixed?

**Say first:** *“That can happen with any vision model — we use confidence gates, mismatch UI, and mandatory admin closure; AI assists, it doesn’t adjudicate.”*

**Situation (S):** The sharpest version of your concern — a random clean street photo passing as proof.

**Task (T):** Acknowledge the failure mode; list real mitigations and future hardening.

**Action (A):**

**Why it could fail:**

- LLM compares semantics, not GPS coordinates.  
- No perceptual hash lock on “same scene.”  
- Unrelated “clean” image might look “improved” to the model.

**What we do today:**

1. **70% confidence bar** for public green “Verified” badge.  
2. **Mismatch badge** when confidence low or `improved: false`.  
3. **Admin must manually resolve** — no auto-close on AI alone.  
4. **Judge queue** for low-confidence intake (same trust philosophy).  
5. API-down fallback sets `confidence ~0.45` → Mismatch, not Verified.

**Pilot hardening we’d add:** EXIF/GPS proximity check, require proof within X metres of original pin, dual review on severity 5.

**Result (R):** Honest answer scores higher than “our AI is 100% accurate.” You built **human-in-the-loop civic tech**, not autonomous conviction.

---

# Part B — Additional jury questions

## Q11. [JURY] What problem are you solving vs Swachhata / municipal apps?

**Say first:** *“Swachhata proved citizens will photo-report — we add AI triage, dedup, SLA queues, proof comparison, and predictive hotspots on one public timeline.”*

**Situation (S):** Every civic hack gets “Swachhata already exists.”

**Task (T):** Respect the incumbent; state three concrete deltas.

**Action (A):**

| Capability | Swachhata-style apps | Community Hero |
|------------|---------------------|----------------|
| Report intake | Photo + GPS | Photo + video keyframes + voice + map pin |
| Triage | Manual municipal desk | 6-agent Gemini pipeline + confidence gate |
| Duplicates | Limited | Geo + embedding dedup with merge |
| Accountability | Varies | Public timeline + AI before/after proof |
| Prevention | Reactive | Hotspot analytics + insights batch |

**Result (R):** Complementary positioning: “We’re the AI operations layer Swachhata-scale apps could plug into via Open311 export.”

---

## Q12. [JURY] Walk me through the product end-to-end in 60 seconds.

**Say first:** *“See it → report it → neighbours confirm → city fixes → proof on the map.”*

**Situation (S):** Opening Q&A question when they didn’t watch the demo carefully.

**Task (T):** Compress demo script without jargon.

**Action (A):** Landing (live stats) → Report wizard (photo, AI fills form) → Map (marker appears) → Issue detail (timeline) → Neighbour upvotes (Community Verified at 3) → Admin (Judge if needed, assign, in progress) → Resolve with proof → Before/after on public page → Leaderboard points.

**Result (R):** Full loop under one URL; every hop is shippable tonight.

---

## Q13. [JURY] What happens when AI confidence is low?

**Say first:** *“Below 70% confidence the issue goes to Draft and the admin Judge queue — no points, not promoted on the public map.”*

**Situation (S):** Tests whether you blindly trust AI output.

**Task (T):** Explain `REVIEW_CONFIDENCE_THRESHOLD` behaviour.

**Action (A):** `confidenceGateUpdates()` sets `status: Draft`, `aiMetadata.needs_review: true`. Admin **Judge** tab lists flagged reports for approve/reject. Reporter can still see their submission; public map filters drafts. Points awarded only when confidence ≥ 0.7 (`shouldAwardReportPoints`).

**Result (R):** Safety valve for blurry photos, ambiguous scenes, or model uncertainty — human authority approves edge cases.

---

## Q14. [JURY] How does community verification (upvotes) work?

**Say first:** *“Neighbours upvote real issues — 1, 3, and 10 votes unlock verification tiers and boost priority.”*

**Situation (S):** Civic trust often beats pure AI in India; show social layer.

**Task (T):** Explain tiers, rules, anti-gaming.

**Action (A):** `computeVerificationFromUpvotes()`: 1 vote → Acknowledged; 3+ → **Community Verified** status; 10+ → Priority Escalation tier. Reporter cannot upvote own issue. New accounts need first report or 24h before upvoting. Upvotes recalculate `priorityScore`. Firestore `votes` subcollection — one doc per voter ID.

**Result (R):** AI proposes; community confirms. Reduces single-user hoaxes without blocking first reporter.

---

## Q15. [JURY] How do you stop spam and fake reports?

**Say first:** *“Defense in depth — intake agent, rate limits, confidence gate, upvote rules, Firestore rules, admin judge.”*

**Situation (S):** Open reporting is attack surface.

**Task (T):** Stack controls beyond “we use AI.”

**Action (A):** Intake keyword blocklists + Gemini safety image check; API rate limiting; confidence &lt; 0.7 → Draft; server-only writes for `status`, `priorityScore`, `embedding`; admin role via custom claim; demo vs production auth separation.

**Result (R):** Attack cost is high; garbage reports land in review queue, not the public map.

---

## Q16. [JURY] What if Gemini is down or too expensive at scale?

**Say first:** *“Image analysis cache, embedding reuse, lite model for narratives, keyword fallback, Cloud Run scale-to-zero.”*

**Situation (S):** Production literacy — cost and resilience.

**Task (T):** Show you thought about ops, not just demo.

**Action (A):**

- **L2 cache:** SHA-256 of image → skip Gemini if cached (confidence ≥ 0.65).  
- **Dedup:** reuse stored embeddings on issues.  
- **Degraded mode:** keyword classifier from citizen hint if Gemini unavailable.  
- **Models:** Flash for vision; Flash-lite for short text.  
- **Infra:** Cloud Run scales to zero; single container reduces ops surface.

**Result (R):** Demo stays up; pilot budget is predictable. Vertex in `asia-south1` for production latency.

---

## Q17. [JURY] Privacy — what about citizen location and photos?

**Say first:** *“Civic reports are public by design — exact pin and photo visible on the map; we don’t sell data; auth protects write actions.”*

**Situation (S):** Location + photos trigger privacy questions.

**Task (T):** State what’s public, what’s protected, what you’d add for GDPR-style pilots.

**Action (A):** Public: issue location, description, photos on map (like Swachhata model). Protected: users can’t forge votes or admin fields; gamification points server-side only. Auth required to report (Google/demo/guest). Not storing Aadhaar or phone in issue docs. **Future:** blur faces/license plates, approximate pin for sensitive categories, retention policy.

**Result (R):** Transparent trade-off: accountability requires public evidence; you’re not a covert surveillance app.

---

## Q18. [JURY] Is this production-ready? How would a municipality adopt it?

**Say first:** *“Live on Cloud Run today; adoption path is Open311 export, ward admin onboarding, and webhook to their existing CRM — not rip-and-replace.”*

**Situation (S):** “Cool hack” vs “deployable product.”

**Task (T):** Cite live URL + integration story + honest gaps.

**Action (A):** **Today:** `community-hero-987477089222.asia-south1.run.app`, CI deploy, health checks, Firestore rules, Capacitor APK, multi-city seed data, Open311 export endpoint, embeddable map widget. **Adoption:** export issues via Open311 adapter; department scorecards align to their SLAs; admin claim per ward. **Not yet:** live bidirectional sync with BBMP/NDMC ticketing, SMS alerts, official legal MOU.

**Result (R):** Shipped product with clear pilot path — municipality keeps their system, we feed classified, deduped, SLA-tagged tickets.

---

## 12-minute Q&A — which questions to expect

| Minute | Likely focus | Best questions |
|--------|--------------|----------------|
| 0–2 | Product clarity | Q12, Q11 |
| 2–7 | Technical depth | **Q1–Q10 (your list)** |
| 7–10 | Trust & limits | Q9, Q10, Q13, Q15 |
| 10–12 | Ship & scale | Q16, Q18, Q5 |

**If they only ask 8 questions:** Almost always includes Firebase/Firestore, AI/vision, agents, and one “what if AI is wrong” — that’s Q1, Q2, Q4, Q6, Q10 plus two from Part B.

---

## Rapid-fire backups (20 one-liners)

| If they ask… | One line |
|--------------|----------|
| Video upload? | Client extracts 3 keyframes as WebP; raw video never hits server. |
| Custom ML model? | No — Gemini Vision + text-embedding-004 + rule tables. |
| Why six agents not one prompt? | Separation of concerns, audit log per step, fail-fast on intake. |
| Dedup vs vision? | Dedup is text+geo; vision already ran earlier in pipeline. |
| SLA agent? | SLA is part of Routing agent — not a seventh agent. |
| Map only 2 issues? | Fixed — loads all issues via API; city chips filter by ward. |
| Hotspot purple rings? | Precomputed geohash density; optional layer, not individual issues. |
| Guest vs Google login? | Guest can browse; report needs identity for accountability. |
| Admin vs citizen? | Custom claim `admin: true`; separate onboarding flows. |
| Open311? | Export adapter in API; import webhook = pilot work. |
| Impact metrics? | Dashboard: open/resolved, SLA %, category trends, hotspots. |
| Gamification ethics? | Opt-in leaderboard; points for real actions, no dark patterns. |
| Offline? | PWA drafts queue locally; syncs on reconnect. |
| Android app? | Capacitor shell → same Cloud Run URL, no forked backend. |
| Gemini cost? | Image hash cache + lite model for chat/narratives. |
| Biggest weakness? | Proof comparison is assistive — needs human judge on edge cases. |
| Biggest strength? | Full loop shipped: report → AI → map → verify → resolve with proof. |
| Team / why you? | *(Fill in your names + roles — engineering + domain passion for Indian cities.)* |
| Next 90 days? | Ward pilot, face blur, municipal webhook, Hindi voice-first reporting. |
| GitHub / reproducibility? | Open repo + `make deploy` + seeded Firestore script. |

---

*Community Hero jury prep · Part A = your questions · Part B = jury extensions · Regenerate PDF: `node presentation preparation/generate-jury-qa-pdf.mjs`*
