import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  POINTS,
  POINTS_CONFIDENCE_THRESHOLD,
  computeWeeklyPoints,
  currentWeekKey,
  filterLeaderboardUsers,
  hasSevenDayStreakIncludingToday,
  mapLeaderboardUser,
  shouldAwardReportPoints,
  sortLeaderboardUsers,
} from '../src/lib/gamification'

describe('Gamification point confidence gate', () => {
  it('awards report points at threshold 0.7', () => {
    assert.equal(shouldAwardReportPoints(POINTS_CONFIDENCE_THRESHOLD), true)
    assert.equal(shouldAwardReportPoints(0.85), true)
  })

  it('blocks report points below 0.7', () => {
    assert.equal(shouldAwardReportPoints(0.69), false)
    assert.equal(shouldAwardReportPoints(0.6), false)
  })
})

describe('Gamification weekly points', () => {
  it('accumulates within the same ISO week', () => {
    const week = '2026-W26'
    assert.equal(computeWeeklyPoints(week, 10, week, 5), 15)
  })

  it('resets when week changes', () => {
    assert.equal(computeWeeklyPoints('2026-W25', 40, '2026-W26', 10), 10)
  })
})

describe('Gamification streak helper', () => {
  it('detects 7 consecutive days including today', () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }
    assert.equal(hasSevenDayStreakIncludingToday(dates), true)
  })

  it('rejects gaps in streak', () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      if (i === 3) continue
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }
    assert.equal(hasSevenDayStreakIncludingToday(dates), false)
  })
})

describe('Leaderboard ranking', () => {
  const week = currentWeekKey()

  it('sorts all-time by civicPoints', () => {
    const ranked = sortLeaderboardUsers(
      [
        mapLeaderboardUser('a', { civicPoints: 50, weeklyPoints: 5, weeklyPointsWeek: week }, week),
        mapLeaderboardUser('b', { civicPoints: 120, weeklyPoints: 10, weeklyPointsWeek: week }, week),
      ],
      'alltime',
    )
    assert.equal(ranked[0]?.uid, 'b')
  })

  it('sorts weekly by weeklyPoints not all-time total', () => {
    const ranked = sortLeaderboardUsers(
      [
        mapLeaderboardUser('a', { civicPoints: 200, weeklyPoints: 15, weeklyPointsWeek: week }, week),
        mapLeaderboardUser('b', { civicPoints: 40, weeklyPoints: 55, weeklyPointsWeek: week }, week),
      ],
      'weekly',
    )
    assert.equal(ranked[0]?.uid, 'b')
  })

  it('filters zero-point rows per period', () => {
    const users = [
      mapLeaderboardUser('a', { civicPoints: 0, weeklyPoints: 0, weeklyPointsWeek: week }, week),
      mapLeaderboardUser('b', { civicPoints: 30, weeklyPoints: 0, weeklyPointsWeek: week }, week),
    ]
    assert.deepEqual(filterLeaderboardUsers(users, 'alltime').map((u) => u.uid), ['b'])
    assert.deepEqual(filterLeaderboardUsers(users, 'weekly').map((u) => u.uid), [])
  })
})

describe('Gamification constants', () => {
  it('matches Appendix O point economy', () => {
    assert.equal(POINTS.report, 10)
    assert.equal(POINTS.upvote, 5)
    assert.equal(POINTS.merge, 15)
    assert.equal(POINTS.neighborhood_voice, 15)
    assert.equal(POINTS.resolved, 25)
    assert.equal(POINTS.streak_bonus, 30)
  })

  it('currentWeekKey uses ISO week format', () => {
    assert.match(currentWeekKey(), /^\d{4}-W\d{2}$/)
  })
})
