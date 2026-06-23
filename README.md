# Community Hero (CIVICPULSE AI)

Hyperlocal civic issue reporting for Indian urban citizens — potholes, water leaks, streetlights, and waste. Built for **Vibe to Ship (Vibe2Ship)** — Problem Statement 2: Community Hero.

## Submission URLs

| Item | URL |
|------|-----|
| **Deployed app (Cloud Run)** | https://community-hero-987477089222.asia-south1.run.app |
| Vercel preview | https://community-hero-eight.vercel.app |
| GitHub | https://github.com/Ojas-Srivastava05/community-hero |

## Features (Phases 0–19)

- 3-step report wizard with **Gemini Vision** image analysis
- **Google Maps** explorer + list fallback
- Issue detail, status timeline, community upvote verification
- My Reports with SLA countdown
- 6-agent orchestration (vision, routing, SLA, dedup, gamification)
- Admin panel for status updates
- Impact dashboard with Recharts + AI insights
- Predictive hotspots + Open311 export
- Civic leaderboard + gamification
- Gemini civic assistant chat with tool calling

## Google stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite PWA (Civic Glass design) |
| Backend | Node.js + Express (API + static serve) |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| AI | Gemini 2.0 Flash / Flash Lite |
| Maps | Google Maps Platform |
| Deploy | Cloud Run (`asia-south1`) + Vercel preview |

## Local development

```bash
cp .env.example frontend/.env    # Firebase keys
cd server && cp ../.env.example .env && npm install && npm run dev   # :3001
cd frontend && npm install && npm run dev   # :5173 (proxies /api)
```

Seed demo data: `cd server && npx tsx scripts/seed-firestore.ts`

Deploy Cloud Run: `bash scripts/deploy-cloud-run.sh`

## Firebase project

Dedicated project: `community-hero-vibe2ship` (isolated from LogiFlow).

Add Cloud Run hostname to **Firebase Auth → Authorized domains** for Google Sign-In on production.

## Design

**Codename:** Civic Glass — dark, map-first, teal accent `#14B8A6`. See `.stitch/DESIGN.md`.

## License

MIT — Vibe to Ship submission
