# CIVICPULSE AI — Final deck wrap-up

**File:** `CIVICPULSE AI Presentation.pdf` (11 slides)  
**Live path (8 min):** 1 → 2 → 3 → 4 → 5 → 6 (demo) → 7 → 11 — skip 8–10 unless Q&A.

---

## 1. Replace Slide 3 diagram (do this now)

1. Open the deck in Google Slides.
2. Select the citizen journey image on **Slide 3**.
3. **Insert → Image → Upload** →  
   `presentation preparation/slide-images/slide-03-citizen-journey-diagram.png`
4. Resize to **full width** of the content area (same width as the old diagram).
5. Keep the slide title/subtitle and **three bottom cards** (AI triage · Community verify · Public closure) — do not crop them.

**v3 fixes:** wide 16:9 banner, short step labels only, Step 5 = **Community Boost / neighbours verify** (not AI).

---

## 2. Quick slide checklist

| # | Status | Asset / note |
|---|--------|----------------|
| 1 | OK | `slide-01-landing-screenshot.png` |
| 2 | OK | Problem columns (no asset change) |
| 3 | **Replace image** | `slide-03-citizen-journey-diagram.png` (v3) |
| 4 | OK | `slide-04-agent-workflow-diagram.png` |
| 5 | OK | `slide-05-admin-console.png` |
| 6 | OK | Live demo + `slide-05-qr-code.png` |
| 7 | OK | “Shipped in production” (not judges) |
| 8 | Backup | `slide-08-system-architecture-diagram.png` |
| 9 | Backup | Tech stack text |
| 10 | OK | `slide-10-01` … `slide-10-06` (9:16 gallery) |
| 11 | OK | Close: **Report once. Track in public. Resolve with proof.** |

**Slide 11 links:** Live app · GitHub · APK (Google Drive) — add Google Doc link if BlockseBlock requires it.

---

## 3. Export PDF

1. **File → Download → PDF Document (.pdf)**  
2. Save as `CIVICPULSE AI Presentation.pdf` in repo root (overwrite).
3. Optional re-audit:
   ```bash
   # if you have a pdf-to-png tool locally, re-export pages to pdf-review/
   ```

---

## 4. Rehearsal timing (~8:00)

| Slide | ~Time | Talk track |
|-------|-------|------------|
| 1 | 0:30 | Title + one-line pitch |
| 2 | 0:45 | Problem — 3 pain columns |
| 3 | 0:45 | Solution + walk the 7-step banner left→right |
| 4 | 0:45 | 6 agents orchestration |
| 5 | 0:30 | Authority console / ops queue |
| 6 | 3:00 | **Live demo** (QR backup if Wi‑Fi fails) |
| 7 | 0:40 | Impact + Google stack |
| 11 | 0:25 | Punchline + links |

---

## 5. Optional polish (only if time)

- Re-capture issue detail with agent stepper visible:  
  `node scripts/capture-slide-screenshots.mjs`
- Refresh QR if production URL changes.

**You’re done when:** Slide 3 image is swapped, PDF exported, and you’ve run through slides 1–7 + 11 once with a timer.
