import { Router } from 'express'
import { sendServerError } from '../lib/errors'
import { requireAdminSecret } from '../middleware/admin-secret'
import { db } from '../lib/firebase-admin'
import {
  buildCategoryTrends,
  buildDailyCounts,
  buildOpenResolvedDaily,
  computeHotspots,
  computeSummary,
  detectRecurringIssues,
  detectSeasonalWasteSpike,
  fetchIssuesAndUpvotes,
  getL3Summary,
  invalidateL3Summary,
  isAnalyticsDailyStale,
  readAnalyticsDaily,
  setL3Summary,
  summaryFromAnalyticsDaily,
  writeAnalyticsDaily,
  type IssueRow,
} from '../lib/analytics-cache'
import { generateInsight, generateTrendNarrative } from '../lib/gemini'
import { runInsightsBatch } from '../lib/agents'

export const analyticsRouter = Router()

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function filterByWard(issues: IssueRow[], wardId?: string) {
  if (!wardId) return issues
  return issues.filter((i) => i.wardId === wardId)
}

async function persistHotspots(
  hotspots: ReturnType<typeof computeHotspots>,
  wardId?: string,
): Promise<void> {
  const now = new Date().toISOString()
  await Promise.all(
    hotspots.map((h) =>
      db
        .collection('hotspots')
        .doc(h.geohash)
        .set({
          issueCount: h.count,
          recentCount: h.recent,
          predictedRisk: h.score,
          predictive: h.predictive,
          categories: h.categories,
          lat: h.lat,
          lng: h.lng,
          severity: h.severity,
          wardId: wardId || null,
          updatedAt: now,
        }),
    ),
  )
}

analyticsRouter.get('/summary', async (req, res) => {
  try {
    let insightsBatch: Record<string, unknown> | null = null
    if (req.query.refresh === '1') {
      invalidateL3Summary()
      insightsBatch = (await runInsightsBatch()) as unknown as Record<string, unknown>
    } else {
      const insightsDoc = await db.collection('analytics').doc('insights_latest').get().catch(() => null)
      insightsBatch = insightsDoc?.exists ? (insightsDoc.data() as Record<string, unknown>) : null
    }

    const cached = getL3Summary()
    if (cached) {
      let insight = ''
      try {
        insight = await generateInsight(cached)
      } catch {
        insight = `Based on ${cached.open} open and ${cached.resolved} resolved issues nearby, waste and road categories often need the most attention.`
      }
      return res.json({ ...cached, insight, cached: true, insightsBatch })
    }

    const dailyDocId = `${dayKey()}_all`
    const dailyCached = await readAnalyticsDaily(dailyDocId)
    if (dailyCached) {
      const summary = summaryFromAnalyticsDaily(dailyCached)
      setL3Summary(summary)
      let insight = ''
      try {
        insight = await generateInsight(summary)
      } catch {
        insight = `Based on ${summary.open} open and ${summary.resolved} resolved issues nearby, waste and road categories often need the most attention.`
      }
      return res.json({ ...summary, insight, cached: true, fromDaily: true, insightsBatch })
    }

    const { issues, upvoteEvents } = await fetchIssuesAndUpvotes()
    const summary = computeSummary(issues, upvoteEvents)

    if (await isAnalyticsDailyStale(dailyDocId)) {
      await writeAnalyticsDaily(dailyDocId, summary, null)
    }

    setL3Summary(summary)

    let insight = ''
    try {
      insight = await generateInsight(summary)
    } catch {
      insight = `Based on ${summary.open} open and ${summary.resolved} resolved issues nearby, waste and road categories often need the most attention.`
    }
    res.json({ ...summary, insight, insightsBatch })
  } catch (e) {
    sendServerError(res, e)
  }
})

analyticsRouter.post('/internal/insights', async (req, res) => {
  if (!requireAdminSecret(req, res)) return
  try {
    const result = await runInsightsBatch()
    res.json(result)
  } catch (e) {
    sendServerError(res, e)
  }
})

analyticsRouter.get('/trends', async (req, res) => {
  try {
    const wardId = req.query.ward_id as string | undefined
    const dailyDocId = `${dayKey()}_${wardId || 'all'}`
    const dailyCached = await readAnalyticsDaily(dailyDocId)

    const { issues: allIssues } = await fetchIssuesAndUpvotes()
    const issues = filterByWard(allIssues, wardId)

    const categoryTrends = buildCategoryTrends(issues)
    const recurringIssues = detectRecurringIssues(issues)
    const seasonalWasteSpike = detectSeasonalWasteSpike(categoryTrends)
    const daily7 = buildOpenResolvedDaily(issues, 7)
    const daily30 = buildDailyCounts(issues, 30)
    const summary = dailyCached
      ? summaryFromAnalyticsDaily(dailyCached)
      : computeSummary(issues, [])

    const storedInsight = await db.collection('insights').doc('latest').get()
    const storedNarrative = storedInsight.exists ? (storedInsight.data()?.narrative as string) : ''

    const trendPayload = {
      daily7,
      daily30,
      daily: daily7,
      categoryTrends,
      recurringIssues,
      seasonalWasteSpike,
      byCategory: summary.byCategory,
      avgResolutionHours: summary.avgResolutionHours,
      wardBreakdown: summary.wardBreakdown,
      departmentSla: summary.departmentSla,
      preventiveZones: computeHotspots(issues, wardId).filter((h) => h.predictive),
    }

    let narrative = storedNarrative
    if (!narrative) {
      try {
        narrative = await generateTrendNarrative(trendPayload)
      } catch {
        const top = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]
        narrative = top
          ? `${top[0].replace(/_/g, ' ')} leads with ${top[1]} reports. ${summary.open} issues remain open.`
          : 'Trend data is building as citizens report issues.'
        if (seasonalWasteSpike) narrative += ` ${seasonalWasteSpike.message}`
        if (recurringIssues.length > 0) {
          const r = recurringIssues[0]
          narrative += ` Recurring ${r.category} cluster detected at geohash ${r.geohash6} (${r.count} reports in 30 days).`
        }
      }
    }

    res.json({ ...trendPayload, narrative, cached: Boolean(dailyCached) })
  } catch (e) {
    sendServerError(res, e)
  }
})

analyticsRouter.get('/hotspots', async (req, res) => {
  try {
    const wardId = req.query.ward_id as string | undefined
    const snap = await db
      .collection('issues')
      .where('status', 'in', ['Submitted', 'Community Verified', 'Assigned', 'In Progress'])
      .limit(200)
      .get()
    const issues = snap.docs.map((d) => d.data()) as IssueRow[]
    const hotspots = computeHotspots(issues, wardId)

    await persistHotspots(hotspots, wardId)

    res.json({ hotspots })
  } catch (e) {
    sendServerError(res, e)
  }
})

analyticsRouter.post('/insights-batch', async (req, res) => {
  if (!requireAdminSecret(req, res)) return
  try {
    const { runInsightsBatch } = await import('../lib/agents')
    const result = await runInsightsBatch()
    res.json(result)
  } catch (e) {
    sendServerError(res, e)
  }
})

analyticsRouter.get('/export/open311', async (req, res) => {
  if (!requireAdminSecret(req, res)) return
  try {
    const snap = await db.collection('issues').limit(100).get()
    const { toOpen311Record } = await import('../lib/open311')
    const records = snap.docs.map((d) => toOpen311Record(d.id, d.data()))
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=open311-export.json')
    res.json(records)
  } catch (e) {
    sendServerError(res, e)
  }
})
