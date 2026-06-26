import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { generateInsight } from '../lib/gemini'

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

async function buildThreadSummary(category: string, count: number, latestTitle: string): Promise<string> {
  const label = category.replace(/_/g, ' ')
  const template = `${count} related ${label} report${count === 1 ? '' : 's'} in this area`
  if (!process.env.GEMINI_API_KEY) return template
  try {
    const text = await generateInsight({
      category,
      count,
      latestTitle,
      open: count,
      resolved: 0,
    })
    const oneLine = text.split('\n').map((s) => s.trim()).find(Boolean)
    return oneLine || template
  } catch {
    return template
  }
}

export async function upsertThreadForIssue(issueId: string, geohash: string, title: string, category: string) {
  const prefix = geohash.slice(0, 5)
  const threadId = `thread-${prefix}`
  const ref = db.collection('threads').doc(threadId)
  const existing = await ref.get()
  const now = new Date().toISOString()
  let issueIds: string[]
  if (existing.exists) {
    issueIds = existing.data()?.issueIds || []
    if (!issueIds.includes(issueId)) issueIds.push(issueId)
  } else {
    issueIds = [issueId]
  }
  const summary = await buildThreadSummary(category, issueIds.length, title)
  if (existing.exists) {
    await ref.update({ issueIds, updatedAt: now, count: issueIds.length, summary })
  } else {
    await ref.set({
      geohash: prefix,
      title: `${category.replace(/_/g, ' ')} cluster`,
      summary,
      issueIds,
      count: 1,
      createdAt: now,
      updatedAt: now,
    })
  }
  return threadId
}
