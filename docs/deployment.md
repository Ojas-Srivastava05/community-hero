# Deployment — Community Hero

## Environments

| Environment | Frontend | API | Notes |
|-------------|----------|-----|-------|
| Local dev | Vite `:5173` | Express `:3001` | Separate processes; Vite proxies `/api` |
| Production | Served by Express | Same Cloud Run service | Single container image |

**Production URL:** https://community-hero-987477089222.asia-south1.run.app

## GCP project

| Setting | Value |
|---------|-------|
| Project ID | `community-hero-vibe2ship` |
| Region | `asia-south1` |
| Cloud Run service | `community-hero` |
| Container image | `gcr.io/community-hero-vibe2ship/community-hero:latest` |
| Firebase project | `community-hero-vibe2ship` |
| Storage bucket | `community-hero-vibe2ship-uploads` (server) / `community-hero-vibe2ship.firebasestorage.app` (client) |

Deploy script: `make deploy` → `scripts/deploy-cloud-run.sh`

## Environment variables checklist

### Frontend (`frontend/.env` or baked at build via `frontend/.env.production`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_FIREBASE_API_KEY` | yes | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | `community-hero-vibe2ship.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | `community-hero-vibe2ship` |
| `VITE_FIREBASE_STORAGE_BUCKET` | yes | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | yes | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | yes | Firebase app ID |
| `VITE_GOOGLE_MAPS_API_KEY` | optional | Live map tiles (list fallback without it) |

### Server (local `server/.env` or Cloud Run env)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | local | Default `3001`; Cloud Run sets `8080` |
| `NODE_ENV` | prod | `production` enables SPA static serving |
| `FIREBASE_PROJECT_ID` | yes | `community-hero-vibe2ship` |
| `FIREBASE_STORAGE_BUCKET` | yes | `community-hero-vibe2ship-uploads` |
| `GEMINI_API_KEY` | optional | Live AI; fallbacks work for demo |
| `ADMIN_SECRET` | prod | `x-admin-secret` header for batch analytics endpoints |
| `GOOGLE_MAPS_API_KEY` | optional | Server reverse geocoding |
| `ADMIN_EMAILS` | optional | Comma-separated admin emails |
| `ADMIN_UIDS` | optional | Comma-separated admin Firebase UIDs |
| `INCLUDE_DEMO_ANALYTICS` | optional | `1` includes demo seed in dashboard aggregates |

Copy template from repo root `.env.example`.

### Cloud Run (set by deploy script)

`deploy-cloud-run.sh` sets:

```
FIREBASE_PROJECT_ID=community-hero-vibe2ship
NODE_ENV=production
ADMIN_EMAILS=srivastavaojas454@gmail.com
FIREBASE_STORAGE_BUCKET=community-hero-vibe2ship-uploads
GOOGLE_MAPS_API_KEY=<from VITE_GOOGLE_MAPS_API_KEY>
GEMINI_API_KEY=<if set locally>
ADMIN_SECRET=<if set locally>
INCLUDE_DEMO_ANALYTICS=1
```

Build-time substitutions for the Docker image: `VITE_FIREBASE_*`, `VITE_GOOGLE_MAPS_API_KEY`.

## Firebase console steps

1. **Auth authorized domains** — Add `community-hero-987477089222.asia-south1.run.app`
2. **Storage** — Enable Firebase Storage for client uploads (rules in `storage.rules`)
3. **Deploy rules** (when changed):

```bash
firebase login
firebase use community-hero-vibe2ship
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Deploy to Cloud Run

Prerequisites: `gcloud` CLI, project access, Application Default Credentials.

```bash
# Set secrets locally before deploy (optional)
export GEMINI_API_KEY=...
export VITE_GOOGLE_MAPS_API_KEY=...

make deploy
# or: bash scripts/deploy-cloud-run.sh
```

Verify production:

```bash
make verify
# curls /api/health and /api/reports?limit=1 on Cloud Run
```

## Local commands

```bash
make install      # npm install in frontend + server
make build        # frontend build + server typecheck
make test         # priority score unit test
make test-all     # server tests + frontend + server build
make lint         # frontend ESLint + server tsc
make health       # production uptime-ping via scripts/uptime-ping.sh
make diagrams     # list mermaid sources in docs/diagrams/mermaid/
make seed         # seed Firestore demo issues
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) on push/PR to `main`:

- `npm ci` (root, frontend, server)
- Frontend `npm run build`
- Server `npm run build` (TypeScript check)
- Server `npm test`

## Post-deploy manual steps (BlockseBlock)

See `TODO.md` for submission checklist (Auth domains, Storage, API keys, Google Doc, deadline **June 29, 2026 2:00 PM**).

---

## Section 8.5 — Deployment checklist (AI Studio / Cloud Run)

All items verified for production deploy:

- [x] **Published URL loads on mobile Safari/Chrome** — https://community-hero-987477089222.asia-south1.run.app
- [x] **Camera + GPS permissions work on HTTPS** — report wizard uses getUserMedia + Geolocation on Cloud Run URL
- [x] **Gemini calls succeed server-side (no client key leak)** — `GEMINI_API_KEY` only in Cloud Run env; client uses `/api/reports/analyze`
- [x] **Firestore rules enforce auth on writes** — `firestore.rules` deployed; server uses Admin SDK for privileged ops
- [x] **URL remains live through evaluation period** — do not delete AI Studio app or Cloud Run service until judging completes

Reference: https://ai.google.dev/gemini-api/docs/aistudio-deploying

---

## GitHub Actions deploy (`.github/workflows/deploy.yml`)

Triggers on push to `main`. Requires repository secrets:

| Secret | Required | Purpose |
|--------|----------|---------|
| `GCP_SA_KEY` | yes | JSON service account key with Cloud Build + Cloud Run deploy roles |
| `VITE_FIREBASE_API_KEY` | yes | Baked into frontend at build time |
| `VITE_FIREBASE_APP_ID` | yes | Firebase web app ID |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | e.g. `community-hero-vibe2ship.firebaseapp.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | yes | Firebase sender ID |
| `VITE_FIREBASE_PROJECT_ID` | yes | `community-hero-vibe2ship` |
| `VITE_FIREBASE_STORAGE_BUCKET` | yes | Storage bucket name |
| `VITE_GOOGLE_MAPS_API_KEY` | optional | Maps tiles + server geocoding |
| `GEMINI_API_KEY` | optional | Live AI; fallbacks exist for demo |
| `ADMIN_SECRET` | optional | `x-admin-secret` for insights batch / internal analytics |
| `ADMIN_EMAILS` | optional | Comma-separated admin emails for `/admin` |

Manual deploy alternative: `make deploy` → `scripts/deploy-cloud-run.sh`

---

## Health monitoring

```bash
# One-shot health check
bash scripts/uptime-ping.sh

# Custom URL
bash scripts/uptime-ping.sh https://your-service.run.app

# Cron every 5 min during evaluation (UptimeRobot or crontab)
*/5 * * * * /path/to/Vibe2Ship/scripts/uptime-ping.sh >> /tmp/community-hero-health.log 2>&1
```

---

## QA sign-off

Manual checklist: [`scripts/qa-checklist.md`](../scripts/qa-checklist.md) — Section 33 QA template with P0/P1/P2 items.
