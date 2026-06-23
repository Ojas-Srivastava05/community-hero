# Deployment

## Development

`make dev` — Vite :5173, API :3001

## Preview (Vercel)

Static frontend from `frontend/dist`. API deploys in Phase 2.

## Production (Vibe to Ship)

Google AI Studio → Publish to Cloud Run (asia-south1).  
GCP project: `project-6d6f652b-7066-4341-806`

## Firebase

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,hosting
```
