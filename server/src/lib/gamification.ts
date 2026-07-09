import { db } from './firebase-admin'
import { CONFIDENCE_THRESHOLD } from '../types/shared-constants'

/** Report points only when AI confidence meets the unified threshold */
export const POINTS_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD

export const POINTS = {
  report: 10,
  upvote: 5,
  merge: 15,
  neighborhood_voice: 15,
  resolved: 25,
  ward_guardian_bonus: 20,
  streak_bonus: 30,
  civic_champion_threshold: 100,
} as const

export type AwardResult = {
  pointsAwarded: number
  badgesEarned: string[]
  streakBonus?: number
}

export const BADGE_BY_REASON: Record<string, string> = {
  report: 'First Reporter',
  neighborhood_voice: 'Neighborhood Voice',
  merge: 'Duplicate Hunter',
  resolved: 'Fix Follower',
}

export function shouldAwardReportPoints(confidence: number): boolean {
  return confidence >= POINTS_CONFIDENCE_THRESHOLD
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** ISO week key for weekly leaderboard (e.g. 2025-W26) */
export function currentWeekKey(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function hasSevenDayStreakIncludingToday(dates: string[]): boolean {
  const set = new Set(dates)
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (!set.has(d.toISOString().slice(0, 10))) return false
  }
  return true
}

export function computeWeeklyPoints(
  prevWeek: string | undefined,
  prevWeeklyPoints: number,
  weekKey: string,
  pointsThisAward: number,
): number {
  return prevWeek === weekKey ? prevWeeklyPoints + pointsThisAward : pointsThisAward
}

export type LeaderboardPeriod = 'weekly' | 'alltime'

export type LeaderboardUser = {
  uid: string
  civicPoints: number
  weeklyPoints: number
  badges: string[]
  displayName: string
}

export function mapLeaderboardUser(
  uid: string,
  data: Record<string, unknown>,
  weekKey = currentWeekKey(),
): LeaderboardUser {
  const weeklyPoints = Number(data.weeklyPointsWeek === weekKey ? (data.weeklyPoints ?? 0) : 0)
  return {
    uid,
    civicPoints: Number(data.civicPoints ?? 0),
    weeklyPoints,
    badges: Array.isArray(data.badges) ? (data.badges as string[]) : [],
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Civic Hero',
  }
}

export function sortLeaderboardUsers(
  users: LeaderboardUser[],
  period: LeaderboardPeriod,
): LeaderboardUser[] {
  const key = period === 'weekly' ? 'weeklyPoints' : 'civicPoints'
  return [...users].sort((a, b) => b[key] - a[key])
}

export function filterLeaderboardUsers(users: LeaderboardUser[], period: LeaderboardPeriod): LeaderboardUser[] {
  return users.filter((u) => (period === 'weekly' ? u.weeklyPoints > 0 : u.civicPoints > 0))
}

export async function awardPoints(
  uid: string,
  points: number,
  reason: string,
  meta?: { wardId?: string },
): Promise<AwardResult> {
  const ref = db.collection('users').doc(uid)
  const doc = await ref.get()
  const data = doc.data() || {}
  const badges: string[] = [...(data.badges ?? [])]
  const badgesEarned: string[] = []
  let extraPoints = 0
  let streakBonus = 0

  const addBadge = (name: string) => {
    if (!badges.includes(name)) {
      badges.push(name)
      badgesEarned.push(name)
    }
  }

  const badge = BADGE_BY_REASON[reason]
  if (badge) addBadge(badge)

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (reason === 'report') {
    const today = todayKey()
    const reportDates: string[] = [...(data.reportDates ?? [])]
    if (!reportDates.includes(today)) reportDates.push(today)
    patch.reportDates = reportDates

    const streakBonusDates: string[] = data.streakBonusDates ?? []
    if (!streakBonusDates.includes(today) && hasSevenDayStreakIncludingToday(reportDates)) {
      streakBonus = POINTS.streak_bonus
      extraPoints += POINTS.streak_bonus
      addBadge('Consistent Citizen')
      patch.streakBonusDates = [...streakBonusDates, today]
    }

    if (meta?.wardId) {
      const wardReportCounts: Record<string, number> = { ...(data.wardReportCounts ?? {}) }
      wardReportCounts[meta.wardId] = (wardReportCounts[meta.wardId] ?? 0) + 1
      patch.wardReportCounts = wardReportCounts
      if (wardReportCounts[meta.wardId]! >= 5 && !badges.includes('Ward Guardian')) {
        addBadge('Ward Guardian')
        extraPoints += POINTS.ward_guardian_bonus
      }
    }
  }

  if (reason === 'upvote') {
    const upvotesGiven = (data.upvotesGiven ?? 0) + 1
    patch.upvotesGiven = upvotesGiven
    if (upvotesGiven >= 50) addBadge('Verified Voice')
  }

  const civicPoints = (data.civicPoints ?? 0) + points + extraPoints
  if (civicPoints >= POINTS.civic_champion_threshold) addBadge('Civic Champion')

  const weekKey = currentWeekKey()
  const pointsThisAward = points + extraPoints
  const weeklyPoints = computeWeeklyPoints(
    data.weeklyPointsWeek as string | undefined,
    Number(data.weeklyPoints ?? 0),
    weekKey,
    pointsThisAward,
  )

  patch.civicPoints = civicPoints
  patch.badges = badges
  patch.weeklyPoints = weeklyPoints
  patch.weeklyPointsWeek = weekKey
  await ref.set(patch, { merge: true })

  return {
    pointsAwarded: points + extraPoints,
    badgesEarned,
    streakBonus: streakBonus || undefined,
  }
}
