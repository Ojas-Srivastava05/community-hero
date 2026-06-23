import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '../../../shared/types'

export type Severity = 'low' | 'med' | 'high' | 'critical'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'

export function apiSeverityToUi(severity: number): Severity {
  if (severity >= 5) return 'critical'
  if (severity >= 4) return 'high'
  if (severity >= 3) return 'med'
  return 'low'
}

export function severityLabel(s: Severity) {
  return { low: 'Low', med: 'Moderate', high: 'High', critical: 'Critical' }[s]
}

export function severityClass(s: Severity) {
  return {
    low: 'bg-sev-low/15 text-sev-low border-sev-low/30',
    med: 'bg-sev-med/15 text-sev-med border-sev-med/30',
    high: 'bg-sev-high/15 text-sev-high border-sev-high/30',
    critical: 'bg-sev-critical/15 text-sev-critical border-sev-critical/40',
  }[s]
}

export function issueImage(issue: Issue): string {
  return issue.imageUrls?.[0] || FALLBACK_IMG
}

export function issueReportedAt(issue: Issue): string {
  return formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })
}

export function issueArea(issue: Issue): string {
  return issue.address?.split(',')[0] || issue.wardId || 'Nearby'
}

export function categoryLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function slaHoursLeft(issue: Issue): number | null {
  if (!issue.slaDeadline) return null
  const ms = new Date(issue.slaDeadline).getTime() - Date.now()
  return Math.max(0, Math.round(ms / 3_600_000))
}

export type MapPoint = Issue & { mapLat: number; mapLng: number }

export function issuesToMapPoints(issues: Issue[]): MapPoint[] {
  if (!issues.length) return []
  const lats = issues.map((i) => i.lat)
  const lngs = issues.map((i) => i.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  return issues.map((i) => ({
    ...i,
    mapLat: 12 + ((i.lat - minLat) / (maxLat - minLat || 1)) * 76,
    mapLng: 12 + ((i.lng - minLng) / (maxLng - minLng || 1)) * 76,
  }))
}
