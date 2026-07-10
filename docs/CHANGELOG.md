# Changelog

All notable changes to Community Hero (CIVICPULSE AI) are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v1.0.0-submission] — 2026-06-26

### Added — Phase 18 (Submission package)

- **`docs/submission/GOOGLE-DOC-CONTENT.md`** — Full Appendix J template: 10 sections with real project content, screenshot placeholders, and Appendix A evaluation matrix mapping
- **`docs/ppt-info/SLIDES-COMPLETE.md`** — All 15 jury slides with complete speaker notes and timing
- **`scripts/prepare-submission.sh`** — Tags `v1.0.0-submission`, runs phase verification, prints BlockseBlock's three mandatory URLs
- **`docs/SUBMISSION-CHECKLIST.md`** — Every in-repo box checked with evidence file paths; manual steps flagged for Google Doc publish and BlockseBlock submit

### Added — Phase 19 (Demo & closure)

- **`docs/demo/APPENDIX-I-DEMO-SCRIPT.md`** — Full timed 3-minute judge demo with click paths
- **`docs/demo/REHEARSAL-CHECKLIST.md`** — Twice-timed rehearsal protocol and backup video steps
- **`docs/demo/QR-CODE.md`** — Production URL and QR generation for jury slide
- **`docs/PHASE-COMPLETION-TRACKER.md`** — Phases 0–19 marked 100% with evidence paths

### Changed

- **`README.md`** — Architecture diagram links, official 8-feature table, team section, live URLs
- **`TODO.md`** — All in-repo phases complete; manual steps isolated to Firebase console and BlockseBlock click
- **`docs/README.md`** — Index updated for submission and demo documentation

### Production URLs (submission)

| Item | URL |
|------|-----|
| Cloud Run (primary) | https://community-hero-987477089222.asia-south1.run.app |
| Vercel preview | https://community-hero-eight.vercel.app |
| GitHub | https://github.com/Ojas-Srivastava05/community-hero |

### Manual steps remaining (out of repo)

1. Paste `docs/submission/GOOGLE-DOC-CONTENT.md` into Google Docs; add screenshots; set public view link
2. Firebase Console: authorized domain, Storage, Cloud Run env vars (`GEMINI_API_KEY`, Maps build key)
3. BlockseBlock: Create Project → enter 3 links → Final Submit before June 29, 2026 2:00 PM
4. Rehearse demo twice per `docs/demo/REHEARSAL-CHECKLIST.md`; record backup video

---

## [0.1.0] — 2026-06-23

### Added — Phases 0–17 (core product)

- React 19 + Vite PWA with Civic Glass design (18 routes)
- Firebase Auth, Firestore rules, indexes, Cloud Storage integration
- 3-step report wizard with Gemini Vision analysis and WebP resize
- Google Maps explorer with list fallback and 15s polling
- Issue detail, status timeline, community upvote verification tiers
- My Reports with SLA countdown; Activity feed with thread links
- Impact dashboard (Recharts), hotspots API, AI insight narratives
- Admin panel with status updates and proof photo upload
- 6-agent orchestration pipeline (vision, routing, SLA, dedup, priority, gamification)
- Civic assistant with Gemini function calling
- Open311 export; leaderboard and gamification badges
- Cloud Run deployment (`asia-south1`); demo seed script
- `docs/api_contract.md`, `docs/architecture.md`, `docs/deployment.md`
- Mermaid diagrams 01, 04, 05, 08, 12; GitHub Actions CI; Makefile targets

---

[v1.0.0-submission]: https://github.com/Ojas-Srivastava05/community-hero/releases/tag/v1.0.0-submission
[0.1.0]: https://github.com/Ojas-Srivastava05/community-hero
