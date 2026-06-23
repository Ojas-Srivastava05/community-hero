# API Contract — Phase 1

## GET /api/health

**Response 200**

```json
{
  "status": "ok",
  "service": "community-hero-api",
  "phase": 1,
  "timestamp": "ISO-8601",
  "stack": ["Node.js", "Express", "Firebase Admin (Phase 2+)"]
}
```

## Future (Phase 2+)

- `POST /api/issues` — create report
- `POST /api/issues/:id/analyze` — Gemini vision
- `GET /api/issues` — list with geo filters
