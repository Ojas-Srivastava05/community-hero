# Pipeline 2 — Vision AI Classification

Gemini 2.5 Flash structured vision pipeline that categorizes civic issue photos and returns editable JSON for the report wizard.

## Model

| Property | Value |
|----------|-------|
| Model | `gemini-2.5-flash` (Appendix B — use flash, not flash-image, for JSON) |
| Output | `responseMimeType: application/json` |
| Latency target | < 2 s (Section 4.3 budget) |
| Cache | L2 in-memory SHA256 cache, TTL 1 hr (`server/src/lib/geminiCache.ts`) |

## Endpoints

### POST /api/reports/analyze

Pre-submit analysis for wizard prefill. Auth required.

```
multipart/form-data
  image: File (required)
  hint: string (optional context)
```

Response:

```json
{
  "analysis": {
    "category": "pothole",
    "severity": 4,
    "title": "Large pothole on main road",
    "description": "...",
    "department": "Roads & Infrastructure",
    "safety_risk": true,
    "confidence": 0.91,
    "estimated_fix_days": "5-7 days"
  }
}
```

### Inline on POST /api/reports

If the client submits without prior `confidence` / `analysis` fields and includes an image, the server re-runs `analyzeImage()` on the first uploaded file before agent pipeline.

## Implementation

| File | Role |
|------|------|
| `server/src/lib/gemini.ts` | `analyzeImage()`, prompt, fallback |
| `server/src/lib/media-validation.ts` | Pre-flight blank/MIME checks |
| `server/src/lib/geminiCache.ts` | L2 dedup cache by image hash |
| `server/src/routes/reports.ts` | `/analyze` and create handlers |
| `shared/types.ts` | `IssueAnalysis` interface |

## Structured output schema (Appendix D)

| Field | Type | Notes |
|-------|------|-------|
| `category` | enum | 9 civic categories |
| `severity` | 1–5 | 5 = critical safety |
| `title` | string | ≤ 80 chars suggested |
| `description` | string | Citizen-readable detail |
| `department` | string | BBMP-style department name |
| `safety_risk` | boolean | Triggers priority boost |
| `confidence` | 0–1 | Gate for review queue |
| `estimated_fix_days` | string | Display only |

## Confidence gate (Section 20.3)

```
if confidence < 0.6:
  status = "Draft"
  aiMetadata.needs_review = true
  issue hidden from public map until admin review
```

All AI-derived fields tagged with `aiMetadata.data_source = "ai"`.

## Media validation before Gemini

1. **Size**: buffer ≥ 1024 bytes.
2. **MIME**: jpeg, png, webp, gif, heic, heif.
3. **Blank detection**: low byte variance → `INVALID_MEDIA` (no Gemini call wasted).

Client-side mirror in `frontend/src/lib/image-media.ts` (`isBlankImage`) for instant UX via `InvalidMediaCard`.

## Prompt

System prompt in `gemini.ts`:

> Analyze this civic issue image for an Indian urban context. Return ONLY valid JSON with category, severity, title, description, department, safety_risk, confidence, estimated_fix_days.

Optional `hint` appended from client description context.

## Fallback behavior

When `GEMINI_API_KEY` is unset or Gemini errors:

- Keyword-based category guess from hint text.
- `confidence: 0.75`, generic department assignment.
- Result still cached to avoid repeated failures.

## Agent integration (Phase 6)

Vision Agent (Agent 2) consumes `IssueAnalysis` in `runAgentPipeline()`:

- Maps category → `departmentId` via `DEPARTMENTS` taxonomy.
- Computes `priorityScore` with severity + safety + confidence.
- Triggers Dedup Agent geohash query for duplicate suggestions.

Events logged to `issues/{id}/events` with `type: ai_analysis`.

## Security

- Gemini API key **server-only** — never bundled in Vite client.
- Images analyzed from memory buffer (multer) — not persisted until report submit.
- SafeSearch stretch planned Phase 13.

## Verification checklist

- [ ] Pothole, waste, streetlight sample images return correct categories
- [ ] JSON validates against Appendix D fields
- [ ] Blank/1×1 pixel image returns 400 `INVALID_MEDIA`
- [ ] Identical image re-upload hits L2 cache (lower latency)
- [ ] Low confidence (< 0.6) sets `needs_review` on issue doc
