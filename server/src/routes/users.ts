import { Router } from 'express'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'
import { db } from '../lib/firebase-admin'
import { requireAuth, isAdminUser, type AuthedRequest } from '../middleware/auth'

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
    sendServerError(res, e)
  }
})

usersRouter.patch('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { leaderboardOptIn } = req.body as { leaderboardOptIn?: boolean }
    if (typeof leaderboardOptIn !== 'boolean') {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'leaderboardOptIn must be a boolean')
      return
    }
    const ref = db.collection('users').doc(req.user!.uid)
    const now = new Date().toISOString()
    await ref.set({ leaderboardOptIn, updatedAt: now }, { merge: true })
    res.json({ ok: true, leaderboardOptIn })
  } catch (e) {
    sendServerError(res, e)
  }
})

usersRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const doc = await db.collection('users').doc(req.user!.uid).get()
    res.json({
      user: doc.exists ? { id: doc.id, ...doc.data() } : null,
      admin: isAdminUser(req.user!),
    })
  } catch (e) {
    sendServerError(res, e)
  }
})
