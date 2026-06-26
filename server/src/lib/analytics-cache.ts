import { db } from './firebase-admin'

export const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1000

export type IssueRow = {
  category: string
  status: string
  severity?: number
  createdAt: string
  resolvedAt?: string
  geohash?: string
  lat?: number
  lng?: number
  wardId?: string
  departmentId?: string
  slaDeadline?: string
  isDemo?: boolean
  reporterId?: string
}

export type AnalyticsSummary = {
  total: number
  open: number
  resolved: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
  avgSeverity: number
  avgResolutionHours: number | null
  slaBreached: number
  reportsPerDay: { date: string; count: number }[]
  upvotesPerDay: { date: string; count: number }[]
  wardBreakdown: { wardId: string; total: number; open: number; resolved: number }[]
  departmentSla: {
    departmentId: string
    total: number
    compliant: number
    compliancePct: number | null
  }[]
}

export type AnalyticsDailyDoc = {
  date: string
  wardId: string | null
  openCount: number
  resolvedCount: number
  byCategory: Record<string, number>
  avgResolutionHours: number | null
  slaBreached?: number
  reportsPerDay: { date: string; count: number }[]
  upvotesPerDay: { date: string; count: number }[]
  wardBreakdown: { wardId: string; total: number; open: number; resolved: number }[]
  departmentSla: {
    departmentId: string
    total: number
    compliant: number
    compliancePct: number | null
  }[]
  updatedAt: string
}

let l3Summary: { data: AnalyticsSummary; fetchedAt: number } | null = null

export function getL3Summary(): AnalyticsSummary | null {
  if (!l3Summary) return null
  if (Date.now() - l3Summary.fetchedAt > ANALYTICS_CACHE_TTL_MS) {
    l3Summary = null
    return null
  }
  return l3Summary.data
}

export function setL3Summary(data: AnalyticsSummary): void {
  l3Summary = { data, fetchedAt: Date.now() }
}

export function invalidateL3Summary(): void {
  l3Summary = null
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

export function buildDailyCounts(issues: IssueRow[], days: number) {
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

export function buildUpvotesPerDay(events: { timestamp: string }[], days: number) {
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

export function buildWardBreakdown(issues: IssueRow[]) {
  const wards: Record<string, { total: number; open: number; resolved: number }> = {}
  for (const i of issues) {
    const w = i.wardId || 'Unknown'
    if (!wards[w]) wards[w] = { total: 0, open: 0, resolved: 0 }
    wards[w].total++
    if (['Resolved', 'Closed'].includes(i.status)) wards[w].resolved++
    else wards[w].open++
  }
  return Object.entries(wards)
    .map(([wardId, v]) => ({ wardId, ...v }))
    .sort((a, b) => b.total - a.total)
}

export function buildDepartmentSlaCompliance(issues: IssueRow[]) {
  const depts: Record<string, { total: number; compliant: number }> = {}
  for (const i of issues) {
    if (!['Resolved', 'Closed'].includes(i.status)) continue
    const dept = i.departmentId || 'Unknown'
    if (!depts[dept]) depts[dept] = { total: 0, compliant: 0 }
    depts[dept].total++
    if (i.resolvedAt && i.slaDeadline) {
      if (new Date(i.resolvedAt).getTime() <= new Date(i.slaDeadline).getTime()) {
        depts[dept].compliant++
      }
    } else {
      depts[dept].compliant++
    }
  }
  return Object.entries(depts)
    .map(([departmentId, v]) => ({
      departmentId,
      total: v.total,
      compliant: v.compliant,
      compliancePct: v.total > 0 ? Math.round((v.compliant / v.total) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.total - a.total)
}

export function buildCategoryTrends(issues: IssueRow[]) {
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

export function detectRecurringIssues(issues: IssueRow[]) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000
  const groups: Record<string, { category: string; geohash6: string; count: number }> = {}
  for (const i of issues) {
    const t = new Date(i.createdAt).getTime()
    if (t < thirtyDaysAgo) continue
    const gh6 = (i.geohash || '').slice(0, 6)
    if (!gh6) continue
    const key = `${i.category}:${gh6}`
    if (!groups[key]) groups[key] = { category: i.category, geohash6: gh6, count: 0 }
    groups[key].count++
  }
  return Object.values(groups)
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export function detectSeasonalWasteSpike(
  categoryTrends: Record<string, { last7: number; last30: number; prev7: number }>,
) {
  const waste = categoryTrends.waste
  if (!waste) return null
  if (waste.last7 >= 2 && (waste.prev7 === 0 || waste.last7 >= waste.prev7 * 1.5)) {
    return {
      alert: true,
      last7: waste.last7,
      prev7: waste.prev7,
      message: `Seasonal waste spike: ${waste.last7} waste reports in the last 7 days vs ${waste.prev7} the prior week — schedule preventive sanitation sweeps.`,
    }
  }
  return null
}

export function countSlaBreaches(issues: IssueRow[]): number {
  const now = Date.now()
  return issues.filter(
    (i) =>
      !['Resolved', 'Closed'].includes(i.status) &&
      i.slaDeadline &&
      new Date(i.slaDeadline).getTime() < now,
  ).length
}

export function buildOpenResolvedDaily(issues: IssueRow[], days: number) {
  const now = Date.now()
  const start = now - days * 24 * 3600000
  const buckets: Record<string, { open: number; resolved: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    buckets[dayKey(now - i * 24 * 3600000)] = { open: 0, resolved: 0 }
  }
  for (const issue of issues) {
    const created = new Date(issue.createdAt).getTime()
    if (created >= start) {
      const k = dayKey(created)
      if (k in buckets) buckets[k].open++
    }
    if (issue.resolvedAt) {
      const resolved = new Date(issue.resolvedAt).getTime()
      if (resolved >= start) {
        const k = dayKey(resolved)
        if (k in buckets) buckets[k].resolved++
      }
    }
  }
  return Object.entries(buckets).map(([date, v]) => ({ date, ...v }))
}

export function computeSummary(
  issues: IssueRow[],
  upvoteEvents: { timestamp: string }[],
): AnalyticsSummary {
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

  return {
    total: issues.length,
    open,
    resolved,
    byCategory,
    byStatus,
    avgSeverity: Math.round(avgSeverity * 10) / 10,
    avgResolutionHours,
    slaBreached: countSlaBreaches(issues),
    reportsPerDay: buildDailyCounts(issues, 7),
    upvotesPerDay: buildUpvotesPerDay(upvoteEvents, 7),
    wardBreakdown: buildWardBreakdown(issues),
    departmentSla: buildDepartmentSlaCompliance(issues),
  }
}

export function summaryFromAnalyticsDaily(doc: AnalyticsDailyDoc): AnalyticsSummary {
  return {
    total: doc.openCount + doc.resolvedCount,
    open: doc.openCount,
    resolved: doc.resolvedCount,
    byCategory: doc.byCategory,
    byStatus: {},
    avgSeverity: 0,
    avgResolutionHours: doc.avgResolutionHours,
    slaBreached: doc.slaBreached ?? 0,
    reportsPerDay: doc.reportsPerDay,
    upvotesPerDay: doc.upvotesPerDay,
    wardBreakdown: doc.wardBreakdown,
    departmentSla: doc.departmentSla,
  }
}

export async function readAnalyticsDaily(docId: string): Promise<AnalyticsDailyDoc | null> {
  try {
    const doc = await db.collection('analytics_daily').doc(docId).get()
    if (!doc.exists) return null
    const data = doc.data() as AnalyticsDailyDoc
    if (!data.updatedAt) return null
    if (Date.now() - new Date(data.updatedAt).getTime() > ANALYTICS_CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

export async function isAnalyticsDailyStale(docId: string): Promise<boolean> {
  try {
    const doc = await db.collection('analytics_daily').doc(docId).get()
    if (!doc.exists) return true
    const updatedAt = doc.data()?.updatedAt as string | undefined
    if (!updatedAt) return true
    return Date.now() - new Date(updatedAt).getTime() > ANALYTICS_CACHE_TTL_MS
  } catch {
    return true
  }
}

export async function writeAnalyticsDaily(
  docId: string,
  summary: AnalyticsSummary,
  wardId: string | null = null,
): Promise<void> {
  await db.collection('analytics_daily').doc(docId).set({
    date: dayKey(Date.now()),
    wardId,
    openCount: summary.open,
    resolvedCount: summary.resolved,
    byCategory: summary.byCategory,
    avgResolutionHours: summary.avgResolutionHours,
    slaBreached: summary.slaBreached,
    reportsPerDay: summary.reportsPerDay,
    upvotesPerDay: summary.upvotesPerDay,
    wardBreakdown: summary.wardBreakdown,
    departmentSla: summary.departmentSla,
    updatedAt: new Date().toISOString(),
  })
}

export async function fetchIssuesAndUpvotes(limit = 500) {
  const [snap, upvoteSnap] = await Promise.all([
    db.collection('issues').limit(limit).get(),
    db
      .collectionGroup('events')
      .where('type', '==', 'upvote')
      .limit(500)
      .get()
      .catch(() => null),
  ])
  const issuesRaw = snap.docs.map((d) => d.data()) as IssueRow[]
  const includeDemoAnalytics = process.env.INCLUDE_DEMO_ANALYTICS === '1'
  const issues = includeDemoAnalytics
    ? issuesRaw
    : issuesRaw.filter((i) => !i.isDemo && i.reporterId !== 'demo-seed')
  const upvoteEvents = (upvoteSnap?.docs ?? []).map((d) => d.data() as { timestamp: string })
  return { issues, upvoteEvents }
}
