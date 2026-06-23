import { Router } from 'express'
import { db } from '../lib/firebase-admin'
import { generateInsight } from '../lib/gemini'

export const analyticsRouter = Router()

analyticsRouter.get('/summary', async (_req, res) => {
  try {
    const snap = await db.collection('issues').limit(500).get()
    const issues = snap.docs.map((d) => d.data())
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
    const summary = { total: issues.length, open, resolved, byCategory, byStatus, avgSeverity: Math.round(avgSeverity * 10) / 10 }
    const insight = await generateInsight(summary)
    res.json({ ...summary, insight })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

analyticsRouter.get('/hotspots', async (_req, res) => {
  try {
    const snap = await db.collection('issues').where('status', 'in', ['Submitted', 'Community Verified', 'Assigned', 'In Progress']).limit(200).get()
    const grid: Record<string, { count: number; lat: number; lng: number; severity: number }> = {}
    for (const d of snap.docs) {
      const i = d.data()
      const key = (i.geohash || '').slice(0, 5)
      if (!key) continue
      if (!grid[key]) grid[key] = { count: 0, lat: i.lat, lng: i.lng, severity: 0 }
      grid[key].count++
      grid[key].severity = Math.max(grid[key].severity, i.severity || 1)
    }
    const hotspots = Object.entries(grid)
      .map(([geohash, v]) => ({ geohash, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    res.json({ hotspots })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

analyticsRouter.get('/export/open311', async (_req, res) => {
  try {
    const snap = await db.collection('issues').limit(100).get()
    const records = snap.docs.map((d) => {
      const i = d.data()
      return {
        service_request_id: d.id,
        status: i.status,
        service_name: i.category,
        description: i.description,
        lat: i.lat,
        long: i.lng,
        requested_datetime: i.createdAt,
        updated_datetime: i.updatedAt,
      }
    })
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=open311-export.json')
    res.json(records)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
