import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { generateInsight } from '../lib/gemini'
import { toOpen311Record } from '../lib/open311'

export const analyticsRouter = Router()

type IssueRow = {
  category: string
  status: string
  severity?: number
  createdAt: string
  resolvedAt?: string
  geohash?: string
  lat?: number
  lng?: number
  wardId?: string
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function buildDailyCounts(issues: IssueRow[], days: number) {
  const now = Date.now()
  const start = now - days * 24 * 3600000
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    buckets[dayKey(now - i * 24 * 3600000)] = 0
  }
  for (const issue of issues) {
    const t = new Date(issue.createdAt).getTime()
    if (t >= start) {
      const k = dayKey(t)
      if (k in buckets) buckets[k]++
    }
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

function buildUpvotesPerDay(events: { timestamp: string }[], days: number) {
  const now = Date.now()
  const start = now - days * 24 * 3600000
  const buckets: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    buckets[dayKey(now - i * 24 * 3600000)] = 0
  }
  for (const event of events) {
    const t = new Date(event.timestamp).getTime()
    if (t >= start) {
      const k = dayKey(t)
      if (k in buckets) buckets[k]++
    }
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

function buildCategoryTrends(issues: IssueRow[]) {
  const now = Date.now()
  const last7Start = now - 7 * 24 * 3600000
  const last30Start = now - 30 * 24 * 3600000
  const prev7Start = now - 14 * 24 * 3600000
  const trends: Record<string, { last7: number; last30: number; prev7: number }> = {}

  for (const issue of issues) {
    const t = new Date(issue.createdAt).getTime()
    const cat = issue.category || 'other'
    if (!trends[cat]) trends[cat] = { last7: 0, last30: 0, prev7: 0 }
    if (t >= last7Start) trends[cat].last7++
    if (t >= last30Start) trends[cat].last30++
    if (t >= prev7Start && t < last7Start) trends[cat].prev7++
  }
  return trends
}

analyticsRouter.get('/summary', async (_req, res) => {
  try {
    const [snap, upvoteSnap] = await Promise.all([
      db.collection('issues').limit(500).get(),
      db.collectionGroup('events').where('type', '==', 'upvote').limit(500).get().catch(() => null),
    ])
    const issues = snap.docs.map((d) => d.data()) as IssueRow[]
    const upvoteEvents = (upvoteSnap?.docs ?? []).map((d) => d.data() as { timestamp: string })
    const open = issues.filter((i) => !['Resolved', 'Closed'].includes(i.status)).length
    const resolved = issues.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length
    const byCategory: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const i of issues) {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1
      byStatus[i.status] = (byStatus[i.status] || 0) + 1
    }
    const avgSeverity =
      issues.length > 0 ? issues.reduce((s, i) => s + (i.severity || 0), 0) / issues.length : 0

    const resolvedWithTime = issues.filter((i) => i.resolvedAt && i.createdAt)
    const avgResolutionHours =
      resolvedWithTime.length > 0
        ? Math.round(
            (resolvedWithTime.reduce(
              (s, i) =>
                s + (new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime()) / 3600000,
              0,
            ) /
              resolvedWithTime.length) *
              10,
          ) / 10
        : null

    const summary = {
      total: issues.length,
      open,
      resolved,
      byCategory,
      byStatus,
      avgSeverity: Math.round(avgSeverity * 10) / 10,
      avgResolutionHours,
      reportsPerDay: buildDailyCounts(issues, 7),
      upvotesPerDay: buildUpvotesPerDay(upvoteEvents, 7),
    }
    let insight = ''
    try {
      insight = await generateInsight(summary)
    } catch {
      insight = `Based on ${open} open and ${resolved} resolved issues nearby, waste and road categories often need the most attention.`
    }
    res.json({ ...summary, insight })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

analyticsRouter.get('/trends', async (_req, res) => {
  try {
    const snap = await db.collection('issues').limit(500).get()
    const issues = snap.docs.map((d) => d.data()) as IssueRow[]
    res.json({
      daily7: buildDailyCounts(issues, 7),
      daily30: buildDailyCounts(issues, 30),
      categoryTrends: buildCategoryTrends(issues),
    })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

analyticsRouter.get('/hotspots', async (req, res) => {
  try {
    const wardId = req.query.ward_id as string | undefined
    const persist = req.query.persist === '1'
    const snap = await db
      .collection('issues')
      .where('status', 'in', ['Submitted', 'Community Verified', 'Assigned', 'In Progress'])
      .limit(200)
      .get()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const grid: Record<
      string,
      { count: number; recent: number; lat: number; lng: number; severity: number; score: number }
    > = {}
    for (const d of snap.docs) {
      const i = d.data()
      if (wardId && i.wardId !== wardId) continue
      const key = (i.geohash || '').slice(0, 5)
      if (!key) continue
      const created = new Date(i.createdAt || 0).getTime()
      const isRecent = created >= sevenDaysAgo
      if (!grid[key]) grid[key] = { count: 0, recent: 0, lat: i.lat, lng: i.lng, severity: 0, score: 0 }
      grid[key].count++
      if (isRecent) grid[key].recent++
      grid[key].severity = Math.max(grid[key].severity, i.severity || 1)
    }
    const hotspots = Object.entries(grid)
      .map(([geohash, v]) => ({
        geohash,
        ...v,
        score: v.count * 2 + v.recent * 3 + v.severity,
        predictive: v.recent >= 3 && v.count >= 5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    if (persist) {
      await db.collection('hotspots').doc('latest').set({
        hotspots,
        wardId: wardId || null,
        updatedAt: new Date().toISOString(),
      })
    }

    res.json({ hotspots })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

analyticsRouter.get('/export/open311', async (_req, res) => {
  try {
    const snap = await db.collection('issues').limit(100).get()
    const records = snap.docs.map((d) => toOpen311Record(d.id, d.data()))
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=open311-export.json')
    res.json(records)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
