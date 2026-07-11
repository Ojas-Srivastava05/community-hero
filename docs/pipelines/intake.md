# Pipeline 1 — Report Intake

Citizen-facing capture flow that turns a photo or short video into a validated, geotagged report ready for AI analysis and Firestore persistence.

## Overview

| Step | Component | Latency budget |
|------|-----------|----------------|
| 1. Auth | Firebase Auth (Google Sign-In) | user |
| 2. Media capture | `ReportWizard` step 0 | user |
| 3. Client preprocess | `frontend/src/lib/image-media.ts` | < 500 ms |
| 4. Video keyframes (optional) | `frontend/src/lib/video-media.ts` | < 2 s |
| 5. GPS | HTML5 Geolocation via `LocationProvider` | < 3 s |
| 6. AI prefill | `POST /api/reports/analyze` | < 2 s |
| 7. User edit | Report wizard step 1 | user |
| 8. Location confirm | Places Autocomplete + map pin drop | user |
| 9. Submit | `POST /api/reports` | < 3 s |

See sequence diagram: [`docs/diagrams/mermaid/05-report-intake-sequence.mmd`](../diagrams/mermaid/05-report-intake-sequence.mmd).

## Frontend — Report Wizard

Route: `/report` (`frontend/src/pages/ReportWizard.tsx`)

### Step 0 — Capture

- **Photo**: `accept="image/*"` with `capture="environment"` for mobile camera.
- **Video** (Section 5.1 stretch): `accept="video/*"`, max 25 MB.
  - Client extracts 3 keyframes at **0%, 50%, 100%** of duration via canvas → WebP.
  - Middle frame used for Gemini analysis and upload.
- **Client validation** (`validateAndPreprocessImage`):
  - Reject non-images and files > 50 MB (client compresses photos before upload; videos yield WebP keyframes only).
  - Resize to max **1280 px** width, convert to **WebP** (quality 0.85).
  - Reject **blank** frames (pixel variance < 12) → `InvalidMediaCard`.
- On success, calls `POST /api/reports/analyze` to prefill title, category, severity.

### Step 1 — Describe

User edits AI-suggested title, description, and category chip. No server call.

### Step 2 — Confirm location

- **Places Autocomplete** on address field (`PlacesAutocomplete` + `@react-google-maps/api`).
- **Manual pin drop**: tap map → `onMapClick` → reverse geocode via `GET /api/geo/reverse`.
- **Refresh GPS** resets to device location from `LocationProvider`.
- Nearby duplicate suggestions from `GET /api/reports?lat=&lng=&radius_km=0.3`.

## API — POST /api/reports

Multipart handler in `server/src/routes/reports.ts`.

### Request (Appendix K)

| Field | Type | Required |
|-------|------|----------|
| `title` | string | yes |
| `description` | string | yes |
| `category` | enum (9 categories) | yes |
| `severity` | 1–5 | yes |
| `lat`, `lng` | number | yes |
| `address` | string | optional |
| `images` | file[] (max 3) | recommended |
| `confidence`, `department`, `safety_risk` | from AI | optional |
| `mergeIntoId` | string | optional (dedup merge) |

### Server-side media validation

`server/src/lib/media-validation.ts`:

- Minimum 1 KB buffer size.
- Allowed MIME: `jpeg`, `png`, `webp`, `gif`, `heic`, `heif`.
- Blank detection via byte-sample variance → `400 INVALID_MEDIA`.

### Storage paths

Images uploaded to Cloud Storage: `issues/{id}/{uuid}.{ext}` (Section 28).

### Firestore write

Collection: `issues/{id}` with fields:

- `lat`, `lng`, `geohash` (precision 7), `address`, `wardId`
- `status`: `Submitted` (or `Draft` if confidence < 0.6)
- `reporterId`, `imageUrls[]`, timestamps

After write, `runAgentPipeline()` runs Vision/Routing/Dedup agents (Phase 6).

## Error codes

| Code | HTTP | When |
|------|------|------|
| `INVALID_MEDIA` | 400 | Blank, too small, or unsupported image |
| `NEEDS_REVIEW` | 202 | AI confidence < 0.6 |
| `DUPLICATE_SUGGESTED` | 200 | Nearby duplicate in response payload |

## Rate limits

- 10 reports per user per day (`reportLimit` middleware).

## Environment

| Variable | Role |
|----------|------|
| `GEMINI_API_KEY` | Vision analysis (server only) |
| `VITE_GOOGLE_MAPS_API_KEY` | Client geolocation fallback + Places |
| `GOOGLE_MAPS_API_KEY` | Server reverse geocode |

## Verification checklist (Phase 2 DoD)

- [ ] Photo → WebP 1280 → analyze → edit → submit → Firestore
- [ ] Video → 3 keyframes extracted client-side → analyze middle frame
- [ ] Blank image rejected client-side (`InvalidMediaCard`) and server-side (`INVALID_MEDIA`)
- [ ] `GEMINI_API_KEY` never visible in browser network tab
- [ ] P95 classify latency < 4 s on test image
