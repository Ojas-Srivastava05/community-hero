import { Router } from 'express'
import { db } from '../lib/firebase-admin'

export const threadsRouter = Router()

threadsRouter.get('/', async (_req, res) => {
  try {
    const snap = await db.collection('threads').orderBy('updatedAt', 'desc').limit(50).get()
    const threads = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    res.json({ threads })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

threadsRouter.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('threads').doc(String(req.params.id)).get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const data = doc.data()!
    const issueIds: string[] = data.issueIds || []
    const issues = await Promise.all(
      issueIds.map(async (id) => {
        const i = await db.collection('issues').doc(id).get()
        return i.exists ? { id: i.id, ...i.data() } : null
      }),
    )
    res.json({ thread: { id: doc.id, ...data }, issues: issues.filter(Boolean) })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

export async function upsertThreadForIssue(issueId: string, geohash: string, title: string, category: string) {
  const prefix = geohash.slice(0, 5)
  const threadId = `thread-${prefix}`
  const ref = db.collection('threads').doc(threadId)
  const existing = await ref.get()
  const now = new Date().toISOString()
  if (existing.exists) {
    const issueIds: string[] = existing.data()?.issueIds || []
    if (!issueIds.includes(issueId)) issueIds.push(issueId)
    await ref.update({ issueIds, updatedAt: now, count: issueIds.length })
  } else {
    await ref.set({
      geohash: prefix,
      title: `${category.replace('_', ' ')} cluster`,
      summary: `Related ${category} reports in this area`,
      issueIds: [issueId],
      count: 1,
      createdAt: now,
      updatedAt: now,
    })
  }
  return threadId
}
