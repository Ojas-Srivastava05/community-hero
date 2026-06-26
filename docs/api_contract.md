# API Contract — Community Hero

Base URL (local): `http://localhost:3001`  
Base URL (production): `https://community-hero-987477089222.asia-south1.run.app`

## Authentication

Protected routes require a Firebase ID token:

```
Authorization: Bearer <firebase_id_token>
```

| Code | Meaning |
|------|---------|
| 401 | Missing or invalid token |
| 403 | Authenticated but not permitted (admin-only routes) |
| 429 | Rate limit exceeded (`code: "RATE_LIMITED"`). Response includes `Retry-After` header (seconds). |

### Guest / anonymous access

Read-only endpoints work **without** authentication so share links and map browsing work for guests:

| Route | Guest access |
|-------|----------------|
| `GET /api/reports` | yes |
| `GET /api/reports/:id` | yes |
| `GET /api/threads`, `GET /api/threads/:id` | yes |
| `GET /api/departments` | yes |
| `GET /api/leaderboard` | yes |
| `GET /api/analytics/*` | yes |

Firestore rules mirror this: `issues`, `votes`, `events`, `departments`, and `threads` allow public **read**. **Write** operations (create report, upvote, merge, chat) require Firebase Auth — anonymous/guest users cannot submit reports via the API or client SDK without signing in. Guest reporting via unauthenticated `POST` is intentionally not implemented; use Google Sign-In or email auth.

### Rate limits

Responses with HTTP **429** include a `Retry-After` header (seconds until the window resets).

| Route | Limit |
|-------|-------|
| `POST /api/reports` | 10 per user per 24h |
| `POST /api/reports/:id/upvote` | 30 per user per hour |
| `POST /api/ai/chat` | 20 per user per minute |

---

## Root & health

### `GET /api`

Service metadata.

**Response 200**

```json
{ "name": "Community Hero API", "version": "1.0.0", "docs": "/api/health" }
```

### `GET /api/health`

Liveness check; probes Firestore connectivity.

**Response 200**

```json
{
  "status": "ok",
  "service": "community-hero-api",
  "phase": 19,
  "firestore": "connected",
  "timestamp": "2026-06-26T12:00:00.000Z",
  "stack": ["Node.js", "Express", "Firebase Admin", "Gemini", "Google Maps"]
}
```

`status` is `"degraded"` when Firestore probe fails (`firestore: "error"`).

---

## Reports — `/api/reports`

### `POST /api/reports/analyze`

**Auth required.** Gemini vision analysis of a report photo.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `image` | file | yes |
| `hint` | string | no |

**Response 200**

```json
{
  "analysis": {
    "category": "pothole",
    "severity": 4,
    "title": "Large pothole on main road",
    "description": "...",
    "department": "Roads & Infrastructure",
    "safety_risk": true,
    "confidence": 0.92
  }
}
```

---

### `POST /api/reports`

**Auth required.** Create a new issue (or merge into existing).

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `title` | string (min 3) | yes |
| `description` | string (min 3) | yes |
| `category` | enum | yes |
| `severity` | number 1–5 | yes |
| `lat` | number | yes |
| `lng` | number | yes |
| `address` | string | no |
| `mergeIntoId` | string | no — if set, upvotes target instead of creating |
| `images` | files (max 3) | no |

**Categories:** `pothole`, `water_leak`, `streetlight`, `waste`, `road_damage`, `drainage`, `signage`, `encroachment`, `other`

**Response 201 (new issue)**

```json
{
  "id": "uuid",
  "issue": { "id": "...", "title": "...", "status": "Submitted", "...": "..." },
  "duplicateSuggestions": [{ "id": "...", "title": "...", "similarity": 0.91, "distanceM": 12 }]
}
```

**Response 201 (merge)**

```json
{
  "id": "target-issue-id",
  "merged": true,
  "issue": { "id": "...", "upvoteCount": 4, "...": "..." }
}
```

Runs agent pipeline (routing, SLA, embedding dedup) and awards 10 civic points.

**Dedup:** On submit, `text-embedding-004` vector is stored on the issue (`embedding` field). Candidates within **50 m** (haversine) with cosine similarity **> 0.85** are returned in `duplicateSuggestions`. Pass `mergeIntoId` to upvote an existing issue instead of creating a duplicate.

**Anti-gaming (upvote):** `POST /api/reports/:id/upvote` returns **403** unless the voter has at least one prior report **or** an account older than 24 hours.

---

### `GET /api/reports`

List issues (public).

| Query | Type | Default |
|-------|------|---------|
| `limit` | number | 50 (max 100) |
| `status` | string | — filter by status |
| `lat`, `lng` | number | — enable geo sort |
| `radius_km` | number | 25 when lat/lng set |
| `include_demo` | `1` | exclude demo seed data |

**Response 200**

```json
{ "issues": [{ "id": "...", "title": "...", "lat": 0, "lng": 0, "...": "..." }] }
```

---

### `GET /api/reports/mine`

**Auth required.** Current user's reports (max 50).

**Response 200**

```json
{ "issues": [...] }
```

---

### `GET /api/reports/:id`

Issue detail with timeline events.

**Response 200**

```json
{
  "issue": { "id": "...", "title": "...", "events": "..." },
  "events": [{ "id": "...", "type": "upvote", "actorId": "...", "payload": {}, "timestamp": "..." }]
}
```

**Response 404** — `{ "error": "Not found" }`

---

### `GET /api/reports/:id/vote`

**Auth required.** Check if current user has upvoted.

**Response 200**

```json
{ "voted": true }
```

---

### `POST /api/reports/:id/upvote`

**Auth required.** Upvote an issue. At 3 upvotes → `Community Verified`; awards points.

**Response 200**

```json
{ "count": 3, "verificationLevel": 2 }
```

or `{ "already": true }` if already voted.

---

### `POST /api/reports/:id/merge`

**Auth required.** Merge source issue into target.

**Body:** `{ "targetId": "issue-uuid" }`

**Response 200**

```json
{ "ok": true, "targetId": "...", "upvoteCount": 5 }
```

---

### `POST /api/reports/:id/reopen`

**Auth required.** Reporter or admin reopens a Resolved/Closed issue.

**Response 200** — `{ "ok": true }`  
**Response 403/400** — not permitted or wrong status.

---

### `PATCH /api/reports/:id/status`

**Auth required (admin).** Update issue status; optional proof image.

**Content-Type:** `multipart/form-data`

| Field | Type |
|-------|------|
| `status` | string |
| `proof` | file (optional) |

Admins: `ADMIN_UIDS` or `ADMIN_EMAILS` env. Resolving awards 25 points to reporter.

**Response 200** — `{ "ok": true }`

---

## Analytics — `/api/analytics`

### `GET /api/analytics/summary`

Dashboard aggregates + Gemini insight (fallback text if AI unavailable).

**Response 200**

```json
{
  "total": 42,
  "open": 30,
  "resolved": 12,
  "byCategory": { "pothole": 10 },
  "byStatus": { "Submitted": 20 },
  "avgSeverity": 3.2,
  "insight": "Based on 30 open issues..."
}
```

---

### `GET /api/analytics/hotspots`

Geohash clusters for open issues.

| Query | Type |
|-------|------|
| `ward_id` | string (optional) |

**Response 200**

```json
{
  "hotspots": [
    {
      "geohash": "tdr1q",
      "count": 8,
      "recent": 3,
      "lat": 28.6,
      "lng": 77.2,
      "severity": 4,
      "score": 31,
      "predictive": true
    }
  ]
}
```

Hotspot score: `count * 2 + recent * 3 + severity`.

---

### `GET /api/analytics/trends`

Ward-level trend analytics with Gemini narrative (fallback text if AI unavailable).

| Query | Type |
|-------|------|
| `ward_id` | string (optional) |

**Response 200**

```json
{
  "daily7": [{ "date": "2026-06-21", "open": 3, "resolved": 1 }],
  "daily30": [{ "date": "2026-05-29", "count": 2 }],
  "daily": [{ "date": "2026-06-21", "open": 3, "resolved": 1 }],
  "categoryTrends": {
    "pothole": { "last7": 4, "last30": 12, "prev7": 2 }
  },
  "recurringIssues": [{ "category": "waste", "geohash6": "tdr1q", "count": 3 }],
  "seasonalWasteSpike": null,
  "byCategory": { "pothole": 10 },
  "avgResolutionHours": 18.5,
  "wardBreakdown": [{ "wardId": "W1", "total": 5, "open": 3, "resolved": 2 }],
  "departmentSla": [{ "departmentId": "roads", "total": 4, "compliant": 3, "compliancePct": 75 }],
  "preventiveZones": [{ "geohash": "tdr1q", "count": 8, "recent": 3, "score": 31, "predictive": true }],
  "narrative": "Pothole reports lead this week…",
  "cached": false
}
```

`categoryTrends` compares the last 7 days vs the prior 7 days (`prev7`). `daily30` is report volume per day for the last 30 days. When `analytics_daily` cache is fresh, `cached` may be `true` for ward-scoped aggregates.

---

### `POST /api/analytics/internal/insights`

**Admin secret required** (`x-admin-secret` or `Authorization: Bearer <ADMIN_SECRET>`). Runs the insights batch agent synchronously.

---

### `POST /api/analytics/insights-batch`

Same auth as `internal/insights`. Triggers Agent 6 nightly-style batch: writes `analytics_daily`, `hotspots`, and `insights/latest`.

---

### `GET /api/analytics/export/open311`

Open311-style JSON export (max 100 issues). Sets download headers.

---

## AI — `/api/ai`

### `POST /api/ai/chat`

**Auth required.** Civic assistant with tool use (nearby issues, my reports, hotspots, etc.).

**Body**

```json
{
  "messages": [{ "role": "user", "content": "What's near me?" }],
  "lat": 28.6139,
  "lng": 77.209
}
```

**Response 200**

```json
{ "reply": "Here are nearby open issues..." }
```

**Tools available to the model:** `findNearbyIssues`, `getMyReports`, `getIssueById`, `searchIssues`, `getHotspots`, `getDepartmentInfo`, `explainStatus`.

---

## Geo — `/api/geo`

### `GET /api/geo/reverse`

Reverse geocode coordinates.

| Query | Required |
|-------|----------|
| `lat` | yes |
| `lng` | yes |

**Response 200**

```json
{ "address": "...", "wardId": "...", "lat": 28.61, "lng": 77.21 }
```

---

## Leaderboard — `/api/leaderboard`

### `GET /api/leaderboard`

Top 20 users by `civicPoints` (falls back to report counts if index missing).

**Response 200**

```json
{
  "users": [
    { "uid": "...", "civicPoints": 50, "badges": ["First Reporter"], "displayName": "Civic Hero" }
  ]
}
```

---

## Threads — `/api/threads`

### `GET /api/threads`

List geohash clusters (max 50).

**Response 200**

```json
{ "threads": [{ "id": "thread-tdr1q", "title": "...", "issueIds": ["..."], "count": 3 }] }
```

---

### `GET /api/threads/:id`

Thread with linked issues.

**Response 200**

```json
{
  "thread": { "id": "...", "geohash": "tdr1q", "summary": "...", "issueIds": ["..."] },
  "issues": [{ "id": "...", "title": "..." }]
}
```

---

## Users — `/api/users`

### `POST /api/users/me`

**Auth required.** Upsert profile after sign-in.

**Body:** `{ "displayName?", "email?", "photoURL?" }`

**Response 200** — `{ "ok": true }`

---

### `GET /api/users/me`

**Auth required.** Current user profile.

**Response 200**

```json
{ "user": { "id": "uid", "civicPoints": 10, "badges": [], "displayName": "..." } }
```

---

## Issue statuses

`Submitted` → `Community Verified` → `Assigned` → `In Progress` → `Resolved` / `Closed`  
Low-confidence AI may set `Draft`. Merged issues become `Closed` with `mergedInto`.

## Civic points

| Action | Points |
|--------|--------|
| New report | 10 |
| Upvote (voter) | 5 |
| 3 upvotes on your report | 15 |
| Merge duplicate | 15 |
| Issue resolved | 25 |
