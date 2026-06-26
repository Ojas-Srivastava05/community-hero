# Pipeline: Community Verification (Phase 5)

Hyperlocal trust layer: neighbors confirm real issues via upvotes, with deduplication and anti-gaming.

## Verification tiers

| Upvotes | `verificationLevel` | Status change |
|---------|---------------------|---------------|
| 0 | 0 | `Submitted` |
| 1–2 | 1 | — |
| 3–9 | 2 | `Submitted` → `Community Verified` |
| 10+ | 3 | — |

Implementation: `processUpvote` in `server/src/lib/agents.ts`.

## Anti-gaming

Before an upvote is accepted (`canUserUpvote`):

1. **Account age** — user profile `createdAt` older than **24 hours**, **or**
2. **Prior report** — at least one issue with `reporterId == uid`

Otherwise `POST /api/reports/:id/upvote` returns **403** with `FORBIDDEN`.

Rate limit: **30 upvotes per user per hour** (`upvoteLimit` middleware).

## Duplicate detection (Dedup Agent)

Triggered on every new report in `runAgentPipeline`:

1. Build embedding text: `category | title | description`
2. Call Gemini `text-embedding-004` → store `embedding: number[]` on issue doc
3. Query Firestore: `category == X` AND `geohash` prefix (precision 6, ~1.2 km cell)
4. For each candidate (excluding self, closed, merged):
   - Haversine distance ≤ **50 m**
   - Cosine similarity > **0.85**
5. Matches stored in `aiMetadata.duplicate_suggestions` and returned as `duplicateSuggestions` in `POST /api/reports` response

Client may pass `mergeIntoId` to upvote the existing issue instead (+15 civic points).

See also: [vision.md](./vision.md#deduplication).

## Civic points (verification-related)

| Action | Points |
|--------|--------|
| New report | 10 |
| Upvote (voter) | 5 |
| 3 upvotes on your report | 15 |
| Merge into duplicate | 15 |
| Issue resolved | 25 |

## Rate limits & 429

| Route | Limit | `Retry-After` |
|-------|-------|---------------|
| `POST /api/reports` | 10 / user / 24h | yes |
| `POST /api/reports/:id/upvote` | 30 / user / hour | yes |

`server/src/middleware/rateLimit.ts` sets the `Retry-After` header (seconds) on 429 responses.

## Firestore indexes (dedup query)

Composite index: `(category ASC, geohash ASC)` — see `firestore.indexes.json`.

## Related files

- `server/src/lib/embeddings.ts` — embedding + cosine similarity
- `server/src/lib/agents.ts` — `findDuplicates`, `processUpvote`, `canUserUpvote`
- `server/src/routes/reports.ts` — create + upvote routes
- `docs/api_contract.md` — HTTP contract
