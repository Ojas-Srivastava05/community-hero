import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'

export const commentsRouter = Router({ mergeParams: true })

type CommentDoc = {
  authorId: string
  authorName: string
  body: string
  createdAt: string
  isDemo?: boolean
}

commentsRouter.get('/:id/comments', async (req, res) => {
  try {
    const issueId = String(req.params.id)
    const snap = await db
      .collection('issues')
      .doc(issueId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get()
    const comments = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CommentDoc) }))
    res.json({ comments })
  } catch (e) {
    sendServerError(res, e)
  }
})

commentsRouter.post('/:id/comments', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const issueId = String(req.params.id)
    const body = String(req.body?.body || '').trim()
    if (body.length < 2 || body.length > 1000) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'Comment must be 2–1000 characters')
      return
    }
    const issue = await db.collection('issues').doc(issueId).get()
    if (!issue.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Issue not found')
      return
    }
    const now = new Date().toISOString()
    const doc: CommentDoc = {
      authorId: req.user!.uid,
      authorName: req.user!.email?.split('@')[0] || 'Citizen',
      body,
      createdAt: now,
    }
    const ref = await db.collection('issues').doc(issueId).collection('comments').add(doc)
    await db.collection('issues').doc(issueId).collection('events').add({
      type: 'comment',
      actorId: req.user!.uid,
      payload: { commentId: ref.id },
      timestamp: now,
    })
    res.status(201).json({ id: ref.id, comment: { id: ref.id, ...doc } })
  } catch (e) {
    sendServerError(res, e)
  }
})
