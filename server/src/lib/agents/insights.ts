import { db } from '../firebase-admin'
import {
  buildCategoryTrends,
  computeSummary,
  detectRecurringIssues,
  detectSeasonalWasteSpike,
  fetchIssuesAndUpvotes,
  invalidateL3Summary,
  writeAnalyticsDaily,
  type IssueRow,
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

function computeInsightHotspots(issues: IssueRow[]) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const grid: Record<
    string,
    { count: number; recent: number; lat: number; lng: number; severity: number; score: number }
  > = {}
  for (const i of issues) {
    if (!['Submitted', 'Community Verified', 'Assigned', 'In Progress'].includes(i.status)) continue
    const key = (i.geohash || '').slice(0, 6)
    if (!key) continue
    const created = new Date(i.createdAt || 0).getTime()
    if (!grid[key]) grid[key] = { count: 0, recent: 0, lat: i.lat ?? 0, lng: i.lng ?? 0, severity: 0, score: 0 }
    grid[key].count++
    if (created >= sevenDaysAgo) grid[key].recent++
    grid[key].severity = Math.max(grid[key].severity, i.severity || 1)
  }
  return Object.entries(grid)
    .map(([geohash, v]) => ({
      geohash,
      ...v,
      score: v.count * 2 + v.recent * 3 + v.severity,
      predictive: v.recent >= 3 && v.count >= 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
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

  const hotspots = computeInsightHotspots(issues)
  const updatedAt = new Date().toISOString()
  await Promise.all(
    hotspots.map((h) =>
      db.collection('hotspots').doc(h.geohash).set({
        issueCount: h.count,
        recentCount: h.recent,
        predictedRisk: h.score,
        predictive: h.predictive,
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
