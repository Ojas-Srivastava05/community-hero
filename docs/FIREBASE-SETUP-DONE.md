# Firebase & Cloud Run — automated setup log

**Date:** 2026-06-27

## Completed by agent (no console clicks needed)

| Item | Status | How |
|------|--------|-----|
| Auth authorized domain | ✅ | `community-hero-987477089222.asia-south1.run.app` already in Identity Platform config |
| Google Sign-In | ✅ | `npx firebase-tools deploy --only auth` |
| Admin custom claim | ✅ | `npx tsx server/scripts/set-admin-claim.ts 8xj7BmsQA3ZW6dPRerGKG3Zc1Rn2` |
| `GEMINI_API_KEY` on Cloud Run | ✅ | From GCP API key `community-hero-gemini` |
| `ADMIN_SECRET` on Cloud Run | ✅ | Generated; stored in repo-root `.env.local` |
| Firestore rules | ✅ | Deployed with app releases |
| GCS image uploads | ✅ | Bucket `gs://community-hero-vibe2ship-uploads/issues/` |

## One console click still optional

**Firebase Storage product:** [Open Storage in console](https://console.firebase.google.com/project/community-hero-vibe2ship/storage) → **Get Started** — only required to `firebase deploy --only storage` for `storage.rules`. Server uploads use Admin SDK + GCS and work without this.

## After admin claim

Sign **out** and **sign back in** on the production app so your ID token includes `admin: true`.

## Secrets location

- `.env.local` (gitignored): `ADMIN_SECRET`, `GEMINI_API_KEY`
- Use `ADMIN_SECRET` for `x-admin-secret` header on `POST /api/analytics/insights-batch`

## Cannot automate

- Your Google Sign-In click (OAuth in browser)
- Google Doc publish
- BlockseBlock form submit
- Live demo rehearsal
