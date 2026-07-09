import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

export const notificationsRouter = Router()

notificationsRouter.get('/', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 50)
    const uid = req.user!.uid
    type Row = { id: string; read?: boolean; createdAt?: string; [key: string]: unknown }

    let notifications: Row[] = []
    try {
      const snap = await db
        .collection('notifications')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
      notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Row[]
    } catch {
      const snap = await db.collection('notifications').where('userId', '==', uid).limit(100).get()
      notifications = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Row)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, limit)
    }

    const unreadCount = notifications.filter((n) => !n.read).length
    res.json({ notifications, unreadCount })
  } catch (e) {
    sendServerError(res, e)
  }
})

notificationsRouter.patch('/:id/read', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const ref = db.collection('notifications').doc(id)
    const doc = await ref.get()
    if (!doc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Not found')
      return
    }
    if (doc.data()?.userId !== req.user!.uid) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
      return
    }
    await ref.update({ read: true })
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e)
  }
})

notificationsRouter.post('/read-all', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const uid = req.user!.uid
    let docs: FirebaseFirestore.QueryDocumentSnapshot[] = []
    try {
      const snap = await db
        .collection('notifications')
        .where('userId', '==', uid)
        .where('read', '==', false)
        .limit(100)
        .get()
      docs = snap.docs
    } catch {
      const all = await db.collection('notifications').where('userId', '==', uid).limit(100).get()
      docs = all.docs.filter((d) => !d.data().read)
    }
    const batch = db.batch()
    docs.forEach((d) => batch.update(d.ref, { read: true }))
    if (docs.length) await batch.commit()
    res.json({ ok: true, updated: docs.length })
  } catch (e) {
    sendServerError(res, e)
  }
})
