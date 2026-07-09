# Pipeline: Gamification & Leaderboard (Phase 10)

Civic engagement layer: awards points and badges for verified civic actions, tracks daily
streaks and per-ward activity, and powers the weekly / all-time leaderboard.

Self-contained module (Section 20.1): all economy logic lives in `server/src/lib/gamification.ts`
and is re-exported through `server/src/lib/agents.ts` for callers. Routes only call `awardPoints(...)`;
they never write point fields directly.

## Point economy (Section 5.8 / Appendix O)

Constants are defined once in `POINTS` (`gamification.ts`):

| Action (`reason`) | Points | Awarded to | Trigger |
|-------------------|--------|------------|---------|
| `report` | 10 | reporter | New report, **only if** AI `confidence ≥ 0.7` |
| `upvote` | 5 | voter | Each accepted upvote |
| `neighborhood_voice` | 15 | reporter | When their issue reaches **exactly 3** upvotes |
| `merge` | 15 | merger | Merge into a duplicate (idempotent per target per day) |
| `resolved` | 25 | reporter | Admin sets status to `Resolved` **or** `Closed` |

Bonuses (added on top, inside `awardPoints`):

| Bonus | Points | Condition |
|-------|--------|-----------|
| `streak_bonus` | 30 | 7-day reporting streak including today (once per day) |
| `ward_guardian_bonus` | 20 | 5th+ report in the same `wardId` (first time only) |

### Confidence gate

`shouldAwardReportPoints(confidence)` returns `true` only when `confidence ≥ POINTS_CONFIDENCE_THRESHOLD`
(**0.7**, unified `CONFIDENCE_THRESHOLD`). The same value drives `REVIEW_CONFIDENCE_THRESHOLD` for
`Draft` / `needs_review`. Enforced in `runAgentPipeline` (`server/src/lib/agents/index.ts`).

## Badges

Reason-linked badges (granted the first time the action is performed):

| Badge | Earned when |
|-------|-------------|
| First Reporter | first `report` award |
| Neighborhood Voice | first `neighborhood_voice` award |
| Duplicate Hunter | first `merge` award |
| Fix Follower | first `resolved` award |

Threshold badges (evaluated on every award):

| Badge | Threshold |
|-------|-----------|
| Consistent Citizen | 7-day reporting streak (with `streak_bonus`) |
| Ward Guardian | 5 reports in one ward (with `ward_guardian_bonus`) |
| Verified Voice | 50 upvotes cast (`upvotesGiven ≥ 50`) |
| Civic Champion | `civicPoints ≥ 100` |

Badges are stored as a de-duplicated string array; `AwardResult.badgesEarned` lists only the
badges newly granted by that call (used to drive the client points toast).

## Award triggers (call sites)

| `reason` | Call site | Notes |
|----------|-----------|-------|
| `report` | `runAgentPipeline` — `server/src/lib/agents/index.ts` | gated by confidence; passes `wardId` for streak/ward tracking |
| `upvote` | `processUpvote` — `server/src/lib/agents/index.ts` | one per accepted vote |
| `neighborhood_voice` | `processUpvote` | fires when `count === 3` |
| `merge` | `performMerge` — `server/src/routes/reports.ts` | skipped if `userMergedTargetToday` is true |
| `resolved` | `PATCH /api/reports/:id/status` — `server/src/routes/reports.ts` | on `Resolved` or `Closed` |

## Firestore user document

`awardPoints(uid, points, reason, meta?)` reads `users/{uid}`, computes the new state, and writes
back via `set(..., { merge: true })`. Fields it maintains:

| Field | Type | Purpose |
|-------|------|---------|
| `civicPoints` | number | All-time total |
| `weeklyPoints` | number | Points earned in `weeklyPointsWeek` |
| `weeklyPointsWeek` | string | ISO week key the `weeklyPoints` belong to (e.g. `2026-W27`) |
| `badges` | string[] | Earned badge names |
| `reportDates` | string[] | `YYYY-MM-DD` days the user reported (streak input) |
| `streakBonusDates` | string[] | Days a streak bonus was already granted |
| `wardReportCounts` | Record<wardId, number> | Reports per ward (Ward Guardian) |
| `upvotesGiven` | number | Upvotes cast (Verified Voice) |
| `updatedAt` | string | ISO timestamp |

### Weekly reset

`currentWeekKey()` returns an ISO-8601 week string in UTC. `computeWeeklyPoints(prevWeek, prev, week, delta)`
accumulates within the same week and resets to `delta` when the week rolls over — there is no cron job;
the reset happens lazily on the first award of a new week.

> **Constraint:** `awardPoints` is a non-transactional read-modify-write. It is safe for the normal
> one-action-at-a-time flow, but rapid concurrent awards to the *same* user can drop an increment.
> Points are only ever mutated server-side: `firestore.rules` restricts client writes on `users/{uid}`
> to `userSelfWritableKeys()` (e.g. `displayName`, `leaderboardOptIn`) and rejects any change to the
> gamification fields via `userGamificationUnchanged()`.

## Leaderboard — `GET /api/leaderboard`

`server/src/routes/leaderboard.ts`. Query param `period=weekly` (default `alltime`).

- **Opt-in required:** only users with `leaderboardOptIn == true` are listed.
- `alltime` → `civicPoints`; `weekly` → `weeklyPoints` for the current week (stale weeks read as 0
  via `mapLeaderboardUser`).
- Sorted (`sortLeaderboardUsers`), zero-point rows dropped (`filterLeaderboardUsers`), top **20** returned.
- Fallback path (on query/index error): scans users ordered by `civicPoints`, filters opt-in in memory,
  then applies the same sort/filter/slice.

Response:

```json
{
  "period": "weekly",
  "users": [
    { "uid": "...", "civicPoints": 120, "weeklyPoints": 55, "badges": ["First Reporter"], "displayName": "Civic Hero" }
  ]
}
```

### Opt-in — `PATCH /api/users/me`

Auth required. Body `{ "leaderboardOptIn": boolean }` (must be a boolean, else `400 INVALID_MEDIA`).
Default for new profiles is `false` (Appendix — ethics guardrail: leaderboard is opt-in). Returns
`{ "ok": true, "leaderboardOptIn": <bool> }`.

## Public API (`gamification.ts`)

- `awardPoints(uid, points, reason, meta?) → AwardResult` — the only mutating entry point.
- `shouldAwardReportPoints(confidence)` — confidence gate.
- `currentWeekKey()`, `computeWeeklyPoints(...)`, `hasSevenDayStreakIncludingToday(dates)` — pure helpers.
- `mapLeaderboardUser`, `sortLeaderboardUsers`, `filterLeaderboardUsers` — leaderboard shaping.
- Constants: `POINTS`, `POINTS_CONFIDENCE_THRESHOLD`, `BADGE_BY_REASON`.

Pure helpers are unit-tested in `server/tests/gamification.test.ts`.

## Related

- [verification.md](./verification.md) — upvote flow that triggers `upvote` / `neighborhood_voice`
- [api_contract.md](../api_contract.md#leaderboard--apileaderboard) — HTTP schemas
- [09-gamification-flow.mmd](../diagrams/mermaid/09-gamification-flow.mmd) — flow diagram
