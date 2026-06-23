import { Router } from 'express'
import { db } from '../lib/firebase-admin'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (_req, res) => {
  try {
    const snap = await db.collection('users').orderBy('civicPoints', 'desc').limit(20).get()
    const users = snap.docs.map((d) => ({
      uid: d.id,
      civicPoints: d.data().civicPoints ?? 0,
      badges: d.data().badges ?? [],
      displayName: d.data().displayName || 'Civic Hero',
    }))
    res.json({ users })
  } catch {
    const snap = await db.collection('issues').limit(100).get()
    const counts: Record<string, { count: number; email: string }> = {}
    for (const d of snap.docs) {
      const rid = d.data().reporterId
      if (!rid) continue
      if (!counts[rid]) counts[rid] = { count: 0, email: d.data().reporterEmail || 'Reporter' }
      counts[rid].count++
    }
    const users = Object.entries(counts)
      .map(([uid, v]) => ({ uid, civicPoints: v.count * 10, displayName: v.email.split('@')[0], badges: [] }))
      .sort((a, b) => b.civicPoints - a.civicPoints)
      .slice(0, 20)
    res.json({ users })
  }
})
