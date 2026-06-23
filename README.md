# Community Hero (CIVICPULSE AI)

Hyperlocal civic issue reporting for Indian urban citizens — potholes, water leaks, streetlights, and waste. Built for **Vibe to Ship (Vibe2Ship)** — Problem Statement 2: Community Hero.

## Live preview

**https://community-hero-eight.vercel.app**

GitHub: https://github.com/Ojas-Srivastava05/community-hero

## Google stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite PWA (Civic Glass design) |
| Backend | Node.js + Express (Phase 1 health API) |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore |
| Storage | Firebase Storage (Phase 2+) |
| AI | Gemini 2.0 Flash (Phase 2+) |
| Maps | Google Maps Platform (Phase 3+) |
| Deploy | Google AI Studio → Cloud Run (final); Vercel preview (dev) |

## Phase 1 — complete when

- [x] React + Vite scaffold with Civic Glass landing UI
- [x] Express `/api/health` endpoint
- [x] Firebase config + Auth + Firestore rules skeleton
- [x] `docs/` architecture stubs
- [ ] Firebase project linked + `.env` populated
- [ ] Google Sign-In verified
- [ ] Firestore write test from Profile page
- [ ] GitHub repo pushed

## Firebase project

Dedicated project: `community-hero-vibe2ship` (isolated from LogiFlow).

Local env: `frontend/.env` (gitignored). Production env vars are set on Vercel.

```bash
cp .env.example .env          # add Firebase keys
npm install
npm run dev                   # frontend :5173 + API :3001
```

Open **Profile** tab → Google Sign-In → **Run Firestore Test**.

## Project structure

```
frontend/          React PWA (Civic Glass)
server/            Express API
docs/              Architecture & API docs
.stitch/           Design system for Stitch loop
firestore.rules    Security rules
```

## Design

**Codename:** Civic Glass — dark, map-first, teal accent `#14B8A6`. See `.stitch/DESIGN.md`.

## License

MIT — Vibe to Ship submission
