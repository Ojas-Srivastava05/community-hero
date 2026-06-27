# Google Doc Screenshot Capture Guide

Capture these eight screenshots from production before pasting into Google Docs.

**URL:** https://community-hero-987477089222.asia-south1.run.app  
**Sign in:** Google account (required for report, upvote, assistant)  
**Viewport:** Mobile 390×844 or iPhone 14 Pro in Chrome DevTools

| File | Route / action | What to capture |
|------|----------------|-----------------|
| `01-report-wizard-step1-camera.png` | `/report` Step 1 | Camera/gallery buttons + GPS pin indicator |
| `02-report-wizard-ai-analysis.png` | `/report` Step 2 | AI analysis card: category chip, severity, confidence |
| `03-map-explorer-markers.png` | `/map` | Severity-colored markers in demo ward (run `make seed` if sparse) |
| `04-issue-detail-upvote-timeline.png` | `/issues/:id` | Upvote button, verification badge, status timeline |
| `05-issue-timeline-sla.png` | `/issues/:id` or `/my-reports` | Department assignment + SLA countdown |
| `06-dashboard-charts.png` | `/dashboard` | KPI tiles + Recharts trend chart |
| `07-hotspot-card.png` | `/dashboard` | Hotspot ward card + AI insight narrative |
| `08-leaderboard-badges.png` | `/leaderboard` | Civic points table + badge chips |

## Steps

1. Open production URL in incognito; sign in with Google.
2. Capture each screen; save PNGs to this folder using the filenames above.
3. In Google Docs, paste content from [`../GOOGLE-DOC-CONTENT.md`](../GOOGLE-DOC-CONTENT.md).
4. Replace each **Screenshot placeholder** block with the matching PNG.
5. Embed architecture PNGs from `docs/diagrams/png/01-system-architecture.png` and `04-agent-workflow.png`.
6. Share → **Anyone with the link → Viewer** → copy URL for BlockseBlock.

**Manual only** — cannot be automated from repo. In-repo content is complete in `GOOGLE-DOC-CONTENT.md`.
