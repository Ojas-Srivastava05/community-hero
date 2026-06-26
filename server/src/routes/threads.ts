import { Router } from 'express'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'
import { db } from '../lib/firebase-admin'
import { generateInsight } from '../lib/gemini'
import { cosineSimilarity } from '../lib/embeddings'

export const threadsRouter = Router()

threadsRouter.get('/', async (_req, res) => {
  try {
    const snap = await db.collection('threads').orderBy('updatedAt', 'desc').limit(50).get()
    const threads = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    res.json({ threads })
  } catch (e) {
    sendServerError(res, e)
  }
})

threadsRouter.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('threads').doc(String(req.params.id)).get()
    if (!doc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Not found')
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
    sendServerError(res, e)
  }
})

async function buildThreadSummary(category: string, count: number, latestTitle: string): Promise<string> {
  const label = category.replace(/_/g, ' ')
  const template = `${count} related ${label} report${count === 1 ? '' : 's'} in this area — latest: "${latestTitle}"`
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

const SIMILARITY_THRESHOLD = 0.85

/** Find an existing thread by geohash prefix or embedding similarity */
async function findSimilarThread(
  geohash: string,
  category: string,
  embedding?: number[],
): Promise<string | null> {
  const prefix = geohash.slice(0, 5)
  const primaryId = `thread-${prefix}`
  const primary = await db.collection('threads').doc(primaryId).get()
  if (primary.exists && primary.data()?.category === category) return primaryId

  if (!embedding?.length) return primary.exists ? primaryId : null

  const snap = await db.collection('threads').where('category', '==', category).limit(20).get()
  let bestId: string | null = null
  let bestScore = SIMILARITY_THRESHOLD

  for (const doc of snap.docs) {
    const threadEmbedding = doc.data().embedding as number[] | undefined
    if (!threadEmbedding?.length) continue
    const score = cosineSimilarity(embedding, threadEmbedding)
    if (score >= bestScore) {
      bestScore = score
      bestId = doc.id
    }
  }

  return bestId
}

async function computeCentroid(issueIds: string[]): Promise<{ lat: number; lng: number } | null> {
  if (!issueIds.length) return null
  const docs = await Promise.all(issueIds.map((id) => db.collection('issues').doc(id).get()))
  let lat = 0
  let lng = 0
  let n = 0
  for (const doc of docs) {
    if (!doc.exists) continue
    const d = doc.data()!
    if (typeof d.lat === 'number' && typeof d.lng === 'number') {
      lat += d.lat
      lng += d.lng
      n += 1
    }
  }
  return n > 0 ? { lat: lat / n, lng: lng / n } : null
}

export async function upsertThreadForIssue(
  issueId: string,
  geohash: string,
  title: string,
  category: string,
  embedding?: number[],
) {
  const prefix = geohash.slice(0, 5)
  const similarId = await findSimilarThread(geohash, category, embedding)
  const threadId = similarId || `thread-${prefix}`
  const ref = db.collection('threads').doc(threadId)
  const existing = await ref.get()
  const now = new Date().toISOString()
  let issueIdsArr: string[]
  if (existing.exists) {
    issueIdsArr = existing.data()?.issueIds || []
    if (!issueIdsArr.includes(issueId)) issueIdsArr.push(issueId)
  } else {
    issueIdsArr = [issueId]
  }
  const summary = await buildThreadSummary(category, issueIdsArr.length, title)
  const centroid = await computeCentroid(issueIdsArr)
  const patch: Record<string, unknown> = {
    geohash: prefix,
    category,
    title: `${category.replace(/_/g, ' ')} cluster`,
    summary,
    issueIds: issueIdsArr,
    count: issueIdsArr.length,
    updatedAt: now,
  }
  if (centroid) patch.centroid = centroid
  if (embedding?.length) patch.embedding = embedding

  if (existing.exists) {
    await ref.update(patch)
  } else {
    await ref.set({ ...patch, createdAt: now })
  }
  return threadId
}
