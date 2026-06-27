import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import {
  currentWeekKey,
  filterLeaderboardUsers,
  mapLeaderboardUser,
  sortLeaderboardUsers,
  type LeaderboardPeriod,
} from '../lib/gamification'

export const leaderboardRouter = Router()

async function fetchOptInUsers(period: LeaderboardPeriod) {
  if (period === 'weekly') {
    return db.collection('users').where('leaderboardOptIn', '==', true).limit(200).get()
  }
  return db
    .collection('users')
    .where('leaderboardOptIn', '==', true)
    .orderBy('civicPoints', 'desc')
    .limit(50)
    .get()
}

leaderboardRouter.get('/', async (req, res) => {
  const period: LeaderboardPeriod = req.query.period === 'weekly' ? 'weekly' : 'alltime'
  const weekKey = currentWeekKey()

  try {
    const snap = await fetchOptInUsers(period)
    const users = filterLeaderboardUsers(
      sortLeaderboardUsers(
        snap.docs.map((d) => mapLeaderboardUser(d.id, d.data(), weekKey)),
        period,
      ),
      period,
    ).slice(0, 20)
    res.json({ users, period })
  } catch {
    try {
      const snap = await db.collection('users').orderBy('civicPoints', 'desc').limit(100).get()
      const users = filterLeaderboardUsers(
        sortLeaderboardUsers(
          snap.docs
            .filter((d) => d.data().leaderboardOptIn === true)
            .map((d) => mapLeaderboardUser(d.id, d.data(), weekKey)),
          period,
        ),
        period,
      ).slice(0, 20)
      res.json({ users, period })
    } catch {
      res.json({ users: [], period })
    }
  }
})
