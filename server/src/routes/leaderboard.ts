import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { currentWeekKey } from '../lib/agents'

export const leaderboardRouter = Router()

type LeaderboardUser = {
  uid: string
  civicPoints: number
  weeklyPoints: number
  badges: string[]
  displayName: string
}

function mapUserDoc(d: { id: string; data: () => Record<string, unknown> }): LeaderboardUser {
  const data = d.data()
  const weekKey = currentWeekKey()
  const weeklyPoints = Number(data.weeklyPointsWeek === weekKey ? (data.weeklyPoints ?? 0) : 0)
  return {
    uid: d.id,
    civicPoints: Number(data.civicPoints ?? 0),
    weeklyPoints: Number(data.weeklyPointsWeek === weekKey ? (data.weeklyPoints ?? 0) : 0),
    badges: Array.isArray(data.badges) ? (data.badges as string[]) : [],
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Civic Hero',
  }
}

function sortUsers(users: LeaderboardUser[], period: 'weekly' | 'alltime'): LeaderboardUser[] {
  const key = period === 'weekly' ? 'weeklyPoints' : 'civicPoints'
  return [...users].sort((a, b) => b[key] - a[key])
}

leaderboardRouter.get('/', async (req, res) => {
  const period = req.query.period === 'weekly' ? 'weekly' : 'alltime'

  try {
    const snap = await db
      .collection('users')
      .where('leaderboardOptIn', '==', true)
      .orderBy('civicPoints', 'desc')
      .limit(50)
      .get()
    const users = sortUsers(snap.docs.map((d) => mapUserDoc(d)), period)
      .filter((u) => (period === 'weekly' ? u.weeklyPoints > 0 : u.civicPoints > 0))
      .slice(0, 20)
    res.json({ users, period })
  } catch {
    try {
      const snap = await db.collection('users').orderBy('civicPoints', 'desc').limit(100).get()
      const users = sortUsers(
        snap.docs
          .filter((d) => d.data().leaderboardOptIn === true)
          .map((d) => mapUserDoc(d)),
        period,
      )
        .filter((u) => (period === 'weekly' ? u.weeklyPoints > 0 : u.civicPoints > 0))
        .slice(0, 20)
      res.json({ users, period })
    } catch {
      res.json({ users: [], period })
    }
  }
})
