import { db } from '../firebase-admin'
import {
  buildCategoryTrends,
  computeHotspots,
  computeSummary,
  detectRecurringIssues,
  detectSeasonalWasteSpike,
  fetchIssuesAndUpvotes,
  invalidateL3Summary,
  writeAnalyticsDaily,
} from '../analytics-cache'
import { generateTrendNarrative } from '../gemini'

export type InsightsBatchResult = {
  ok: boolean
  processedAt: string
  totalIssues: number
  openIssues: number
  resolvedIssues: number
  slaBreached: number
  byCategory: Record<string, number>
  byWard: Record<string, number>
  narrative: string
  hotspots: number
  recurringIssues: number
}

/** Agent 6 — Insights Analyst nightly batch */
export async function runInsightsBatch(): Promise<InsightsBatchResult> {
  const { issues, upvoteEvents } = await fetchIssuesAndUpvotes(1000)
  const summary = computeSummary(issues, upvoteEvents)
  const categoryTrends = buildCategoryTrends(issues)
  const recurringIssues = detectRecurringIssues(issues)
  const seasonalWasteSpike = detectSeasonalWasteSpike(categoryTrends)

  const now = Date.now()
  let slaBreached = 0
  const byWard: Record<string, number> = {}
  for (const i of issues) {
    const ward = i.wardId || 'unknown'
    byWard[ward] = (byWard[ward] || 0) + 1
    const isOpen = !['Resolved', 'Closed'].includes(i.status)
    if (isOpen && i.slaDeadline && new Date(i.slaDeadline).getTime() < now) {
      slaBreached++
    }
  }

  const date = new Date().toISOString().slice(0, 10)
  await writeAnalyticsDaily(`${date}_all`, summary, null)

  const hotspots = computeHotspots(issues, undefined, 20)
  const updatedAt = new Date().toISOString()
  await Promise.all(
    hotspots.map((h) =>
      db.collection('hotspots').doc(h.geohash).set({
        issueCount: h.count,
        recentCount: h.recent,
        predictedRisk: h.score,
        predictive: h.predictive,
        categories: h.categories,
        lat: h.lat,
        lng: h.lng,
        severity: h.severity,
        updatedAt,
      }),
    ),
  )

  const trendPayload = {
    byCategory: summary.byCategory,
    categoryTrends,
    recurringIssues,
    seasonalWasteSpike,
    wardBreakdown: summary.wardBreakdown,
    departmentSla: summary.departmentSla,
    preventiveZones: hotspots.filter((h) => h.predictive),
  }

  let narrative = ''
  try {
    narrative = await generateTrendNarrative(trendPayload)
  } catch {
    narrative = `Batch complete: ${summary.open} open, ${summary.resolved} resolved across ${summary.wardBreakdown.length} wards.`
  }

  const result: InsightsBatchResult = {
    ok: true,
    processedAt: updatedAt,
    totalIssues: summary.total,
    openIssues: summary.open,
    resolvedIssues: summary.resolved,
    slaBreached,
    byCategory: summary.byCategory,
    byWard,
    narrative,
    hotspots: hotspots.length,
    recurringIssues: recurringIssues.length,
  }

  await db.collection('insights').doc('latest').set({
    ...trendPayload,
    ok: result.ok,
    processedAt: result.processedAt,
    totalIssues: result.totalIssues,
    openIssues: result.openIssues,
    resolvedIssues: result.resolvedIssues,
    slaBreached: result.slaBreached,
    byCategory: result.byCategory,
    byWard: result.byWard,
    narrative: result.narrative,
    hotspots: result.hotspots,
    recurringIssues: result.recurringIssues,
    agent: 'insights-analyst',
    updatedAt,
  })

  await db.collection('analytics').doc('insights_latest').set(result)

  invalidateL3Summary()

  return result
}

export type IssueInsightResult = {
  narrative: string
  hotspotScore: number
  wardOpenCount: number
  recurring: boolean
  predictive: boolean
}

/** Agent 6 — real-time insight for a single new report (not just batch scheduled). */
export async function runInsightsForIssue(issue: {
  id: string
  category: string
  wardId?: string
  geohash?: string
  lat: number
  lng: number
}): Promise<IssueInsightResult> {
  const { issues } = await fetchIssuesAndUpvotes(300)
  const ward = issue.wardId || 'unknown'
  const openInWard = issues.filter(
    (i) => i.wardId === ward && !['Resolved', 'Closed', 'Draft'].includes(i.status),
  ).length
  const hotspots = computeHotspots(issues, undefined, 24)
  const prefix = (issue.geohash || '').slice(0, 6)
  const cell = hotspots.find((h) => h.geohash.startsWith(prefix) || prefix.startsWith(h.geohash.slice(0, 4)))
  const recurring = detectRecurringIssues(issues).some(
    (r) => r.category === issue.category && r.geohash6 === prefix.slice(0, 6),
  )
  const hotspotScore = cell?.score ?? 0
  const predictive = Boolean(cell?.predictive)
  const narrative = predictive
    ? `Predictive hotspot: ${issue.category} in ${ward} — ${openInWard} open nearby, risk score ${hotspotScore.toFixed(0)}.`
    : `${issue.category} in ${ward} joins ${openInWard} open ward issues${recurring ? ' (recurring pattern)' : ''}.`

  return { narrative, hotspotScore, wardOpenCount: openInWard, recurring, predictive }
}
