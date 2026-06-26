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
| `GOOGLE_MAPS_API_KEY` | optional | Server reverse geocoding |
| `ADMIN_EMAILS` | optional | Comma-separated admin emails |
| `ADMIN_UIDS` | optional | Comma-separated admin Firebase UIDs |

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
make lint         # frontend ESLint
make health       # curl http://localhost:3001/api/health (server must be running)
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
