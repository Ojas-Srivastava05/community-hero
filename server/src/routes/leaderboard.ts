import { Router } from 'express'
import { db } from '../lib/firebase-admin'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (_req, res) => {
  try {
    const snap = await db
      .collection('users')
      .where('leaderboardOptIn', '==', true)
      .orderBy('civicPoints', 'desc')
      .limit(20)
      .get()
    const users = snap.docs.map((d) => ({
      uid: d.id,
      civicPoints: d.data().civicPoints ?? 0,
      badges: d.data().badges ?? [],
      displayName: d.data().displayName || 'Civic Hero',
    }))
    res.json({ users })
  } catch {
    try {
      const snap = await db.collection('users').orderBy('civicPoints', 'desc').limit(50).get()
      const users = snap.docs
        .filter((d) => d.data().leaderboardOptIn === true)
        .slice(0, 20)
        .map((d) => ({
          uid: d.id,
          civicPoints: d.data().civicPoints ?? 0,
          badges: d.data().badges ?? [],
          displayName: d.data().displayName || 'Civic Hero',
        }))
      res.json({ users })
    } catch {
      res.json({ users: [] })
    }
  }
})
