# Presentation Preparation

This folder contains a complete beginner-friendly guide to the **Community Hero (CIVICPULSE AI)** codebase.

## Files

| File | Description |
|------|-------------|
| **COMMUNITY-HERO-COMPLETE-GUIDE.pdf** | Main deliverable — full project guide as PDF (~50+ pages) |
| **COMMUNITY-HERO-COMPLETE-GUIDE.md** | Source markdown (editable) |
| **GOOGLE-SLIDES-PROMPTS-COMPLETE-GUIDE.pdf** | **PPT prompts PDF** — copy-paste Gemini prompts for all 7 slides + backup slides |
| **GOOGLE-SLIDES-PROMPTS-COMPLETE-GUIDE.md** | Source markdown for slide prompts (editable) |
| **8-MINUTE-SPEAKER-SCRIPT.pdf** | **Presentation cue cards PDF** — point-and-talk triggers aligned to the final Google Slides deck |
| **8-MINUTE-SPEAKER-SCRIPT.md** | Source markdown for cue cards (editable) |
| **FULL-ONLINE-SPEAKER-SCRIPT.pdf** | **Full word-for-word online presentation script** (~8 min, slides 1–7 + demo + 11) |
| **FULL-ONLINE-SPEAKER-SCRIPT.md** | Source markdown for full online script (editable) |
| **generate-pdf.mjs** | Regenerate project guide PDF |
| **generate-ppt-prompts-pdf.mjs** | Regenerate slide prompts PDF |
| **generate-speaker-script-pdf.mjs** | Regenerate 8-minute cue cards PDF |
| **generate-full-online-speaker-script-pdf.mjs** | Regenerate full online speaker script PDF |

## Regenerate PDFs

```bash
cd "presentation preparation"
node generate-pdf.mjs                  # project guide
node generate-ppt-prompts-pdf.mjs        # Google Slides prompts
node generate-speaker-script-pdf.mjs     # presentation cue cards PDF
node generate-full-online-speaker-script-pdf.mjs   # full online speaker script PDF
```

Requires: `pandoc` and Playwright (installed at repo root via `npm install`).

## What's inside the guide

- Web apps 101 (frontend, backend, database explained simply)
- Full technology stack glossary
- Every folder and file in the repo
- All 22+ pages/routes and API endpoints
- 6 AI agents pipeline explained
- Database schema, auth, security
- Deployment and local development
- 3-minute demo script and presentation talking points
- Competitive positioning and hackathon criteria mapping
- Complete glossary of technical terms

**Live app:** https://community-hero-987477089222.asia-south1.run.app
