import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

export const usersRouter = Router()

usersRouter.post('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { displayName, email, photoURL } = req.body as {
      displayName?: string
      email?: string
      photoURL?: string
    }
    const ref = db.collection('users').doc(req.user!.uid)
    const existing = await ref.get()
    const now = new Date().toISOString()
    await ref.set(
      {
        displayName: displayName || 'Civic Reporter',
        email: email || req.user!.email || '',
        photoURL: photoURL || '',
        civicPoints: existing.data()?.civicPoints ?? 0,
        badges: existing.data()?.badges ?? [],
        leaderboardOptIn: existing.data()?.leaderboardOptIn ?? false,
        updatedAt: now,
        createdAt: existing.data()?.createdAt ?? now,
      },
      { merge: true },
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

usersRouter.patch('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { leaderboardOptIn } = req.body as { leaderboardOptIn?: boolean }
    if (typeof leaderboardOptIn !== 'boolean') {
      res.status(400).json({ error: 'leaderboardOptIn must be a boolean' })
      return
    }
    const ref = db.collection('users').doc(req.user!.uid)
    const now = new Date().toISOString()
    await ref.set({ leaderboardOptIn, updatedAt: now }, { merge: true })
    res.json({ ok: true, leaderboardOptIn })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

usersRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const doc = await db.collection('users').doc(req.user!.uid).get()
    res.json({ user: doc.exists ? { id: doc.id, ...doc.data() } : null })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
