import type { Issue, IssueAnalysis } from '../../../shared/types'
import type { AgentStep, ProofComparison } from '../lib/shared-constants'

const API_BASE = import.meta.env.VITE_API_URL || ''

function redirectToWaiting(retryAfterHeader: string | null, reason?: 'rate_limit' | 'overload') {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/waiting')) return
  let retry = 30
  if (retryAfterHeader) {
    const parsed = parseInt(retryAfterHeader, 10)
    if (!Number.isNaN(parsed)) retry = Math.max(5, parsed)
  }
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
  const reasonParam = reason === 'overload' ? '&reason=503' : ''
  window.location.assign(`/waiting?retry=${retry}&return=${returnTo}${reasonParam}`)
}

async function apiFetch(path: string, init?: RequestInit, retries = 3): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.ok) return res
      if (res.status === 429 || res.status === 503) {
        redirectToWaiting(
          res.headers.get('Retry-After'),
          res.status === 503 ? 'overload' : 'rate_limit',
        )
        throw new Error(res.status === 503 ? 'Service temporarily unavailable' : 'Rate limited — please wait a moment')
      }
      if (res.status < 500) return res
      const body = await res.text().catch(() => '')
      lastError = new Error(body || `HTTP ${res.status}`)
    } catch (e) {
      lastError = e
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API unavailable — server may be waking up')
}

async function parseApiError(res: Response): Promise<never> {
  const text = await res.text()
  try {
    const j = JSON.parse(text) as { error?: string | object }
    if (typeof j.error === 'string') throw new Error(j.error)
    if (j.error) throw new Error(JSON.stringify(j.error))
  } catch (e) {
    if (e instanceof Error && e.message !== text) throw e
  }
  throw new Error(text || `HTTP ${res.status}`)
}

async function authHeaders(token?: string | null): Promise<HeadersInit> {
  const h: Record<string, string> = {}
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function apiAnalyzeImage(
  file: File,
  token: string,
  hint?: string,
): Promise<{ analysis: IssueAnalysis; agentSteps?: AgentStep[] }> {
  const fd = new FormData()
  fd.append('image', file)
  if (hint) fd.append('hint', hint)
  const res = await apiFetch('/api/reports/analyze', {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiCreateReport(
  data: {
    title: string
    description: string
    category: string
    severity: number
    lat: number
    lng: number
    address?: string
    mergeIntoId?: string
    confidence?: number
    safety_risk?: boolean
    department?: string
  },
  images: File[],
  token: string,
  opts?: {
    stream?: boolean
    onAgentStep?: (step: AgentStep) => void
  },
): Promise<{
  id: string
  issue: Issue
  duplicateSuggestions?: { id: string; title: string }[]
  merged?: boolean
  needsReview?: boolean
  code?: string
  pointsEarned?: { pointsAwarded: number; badgesEarned?: string[]; streakBonus?: number }
  agentSteps?: AgentStep[]
}> {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== '') fd.append(k, String(v))
  })
  if (opts?.stream) fd.append('stream', '1')
  images.forEach((img) => fd.append('images', img))
  const url = opts?.stream ? '/api/reports?stream=1' : '/api/reports'
  const res = await apiFetch(url, {
    method: 'POST',
    headers: {
      ...(await authHeaders(token)),
      ...(opts?.stream ? { Accept: 'application/x-ndjson' } : {}),
    },
    body: fd,
  })
  if (!res.ok) await parseApiError(res)

  if (opts?.stream && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let complete: Record<string, unknown> | null = null
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const msg = JSON.parse(line) as {
            type: string
            step?: AgentStep
            id?: string
            issue?: Issue
            agentSteps?: AgentStep[]
            pointsEarned?: { pointsAwarded: number; badgesEarned?: string[] }
            duplicateSuggestions?: { id: string; title: string }[]
            needsReview?: boolean
            code?: string
          }
          if (msg.type === 'agent_step' && msg.step) opts.onAgentStep?.(msg.step)
          if (msg.type === 'complete') complete = msg as unknown as Record<string, unknown>
        } catch {
          /* skip bad line */
        }
      }
    }
    if (!complete) throw new Error('Stream ended without complete event')
    return {
      id: String(complete.id),
      issue: complete.issue as Issue,
      duplicateSuggestions: complete.duplicateSuggestions as { id: string; title: string }[] | undefined,
      pointsEarned: complete.pointsEarned as { pointsAwarded: number; badgesEarned?: string[] } | undefined,
      agentSteps: complete.agentSteps as AgentStep[] | undefined,
      needsReview: Boolean(complete.needsReview),
      code: complete.code as string | undefined,
    }
  }

  const body = await res.json()
  return {
    ...body,
    needsReview: res.status === 202 || body.code === 'NEEDS_REVIEW',
  }
}

export async function apiTranscribeAudio(file: Blob, token: string, mimeType?: string) {
  const fd = new FormData()
  fd.append('audio', file, `voice.${(mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm'}`)
  const res = await apiFetch('/api/reports/transcribe', {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) await parseApiError(res)
  return res.json() as Promise<{ transcript: string; title: string; description: string }>
}

export async function apiListComments(issueId: string): Promise<{
  comments: { id: string; authorId: string; authorName: string; body: string; createdAt: string }[]
}> {
  const res = await apiFetch(`/api/reports/${issueId}/comments`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiPostComment(issueId: string, body: string, token: string) {
  const res = await apiFetch(`/api/reports/${issueId}/comments`, {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) await parseApiError(res)
  return res.json() as Promise<{ id: string; comment: { id: string; authorName: string; body: string; createdAt: string } }>
}

export async function apiListIssues(
  limit = 50,
  opts?: {
    lat?: number
    lng?: number
    radiusKm?: number
    status?: string
    includeDemo?: boolean
    includeDraft?: boolean
    sortByPriority?: boolean
  },
): Promise<{ issues: Issue[] }> {
  const q = new URLSearchParams({ limit: String(limit) })
  if (opts?.lat !== undefined) q.set('lat', String(opts.lat))
  if (opts?.lng !== undefined) q.set('lng', String(opts.lng))
  if (opts?.radiusKm !== undefined) q.set('radius_km', String(opts.radiusKm))
  if (opts?.status) q.set('status', opts.status)
  if (opts?.includeDemo) q.set('include_demo', '1')
  if (opts?.includeDraft) q.set('include_draft', '1')
  if (opts?.sortByPriority) q.set('sort', 'priority')
  const res = await apiFetch(`/api/reports?${q}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiMyReports(token: string): Promise<{ issues: Issue[] }> {
  const res = await apiFetch('/api/reports/mine', { headers: await authHeaders(token) })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiGetIssue(id: string): Promise<{ issue: Issue; events: unknown[] }> {
  const res = await apiFetch(`/api/reports/${id}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiGetIssueVoteStatus(id: string, token: string): Promise<{ voted: boolean }> {
  const res = await apiFetch(`/api/reports/${id}/vote`, { headers: await authHeaders(token) })
  if (!res.ok) return { voted: false }
  return res.json()
}

export async function apiUpvote(id: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/upvote`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiMergeIssue(sourceId: string, targetId: string, token: string) {
  const res = await apiFetch(`/api/reports/${sourceId}/merge`, {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId }),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiReopenIssue(id: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/reopen`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiUpdateStatus(id: string, status: string, token: string, proof?: File) {
  const fd = new FormData()
  fd.append('status', status)
  if (proof) fd.append('proof', proof)
  const res = await apiFetch(`/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiApproveIssue(id: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/approve`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json() as Promise<{ ok: boolean; status: string }>
}

export async function apiBulkUpdateStatus(ids: string[], status: string, token: string) {
  const res = await apiFetch('/api/reports/bulk-status', {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, status }),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiAnalyticsSummary(): Promise<{
  total: number
  open: number
  resolved: number
  byCategory: Record<string, number>
  insight?: string
  avgResolutionHours?: number | null
  slaBreached?: number
  reportsPerDay?: { date: string; count: number }[]
  upvotesPerDay?: { date: string; count: number }[]
  wardBreakdown?: { wardId: string; total: number; open: number; resolved: number }[]
  departmentSla?: { departmentId: string; total: number; compliant: number; compliancePct: number | null }[]
}> {
  const res = await apiFetch('/api/analytics/summary')
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiHotspots(wardId?: string): Promise<{
  hotspots: {
    geohash: string
    count: number
    recent: number
    lat: number
    lng: number
    severity: number
    score: number
    risk_score?: number
    categories?: string[]
    predictive?: boolean
  }[]
}> {
  const q = wardId ? `?ward_id=${encodeURIComponent(wardId)}` : ''
  const res = await apiFetch(`/api/analytics/hotspots${q}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiTrends(wardId?: string): Promise<{
  narrative?: string
  avgResolutionHours?: number
  byCategory?: Record<string, number>
  daily?: { date: string; open: number; resolved: number }[]
  daily7?: { date: string; open: number; resolved: number }[]
  daily30?: { date: string; count: number }[]
  categoryTrends?: Record<string, { last7: number; last30: number; prev7: number }>
  recurringIssues?: { category: string; geohash6: string; count: number }[]
  seasonalWasteSpike?: { alert: boolean; message: string; last7: number; prev7: number } | null
  wardBreakdown?: { wardId: string; total: number; open: number; resolved: number }[]
  departmentSla?: { departmentId: string; total: number; compliant: number; compliancePct: number | null }[]
  preventiveZones?: {
    geohash: string
    count: number
    recent: number
    score: number
    predictive?: boolean
  }[]
}> {
  const q = wardId ? `?ward_id=${encodeURIComponent(wardId)}` : ''
  const res = await apiFetch(`/api/analytics/trends${q}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiDepartments(): Promise<{
  services: {
    service_code: string
    service_name: string
    description: string
    metadata: {
      category: string
      department: string
      sla_hours: Record<string, number>
    }
  }[]
}> {
  const res = await apiFetch('/api/departments')
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiExportOpen311Single(id: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/open311/export`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiChat(messages: { role: string; content: string }[], token: string, lat?: number, lng?: number) {
  const res = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, lat, lng }),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiLeaderboard(period = 'alltime') {
  const res = await apiFetch(`/api/leaderboard?period=${period}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiGetThread(id: string) {
  const res = await apiFetch(`/api/threads/${id}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiListThreads() {
  const res = await apiFetch('/api/threads')
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiReverseGeocode(lat: number, lng: number) {
  const res = await apiFetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export type UserProfile = {
  id?: string
  civicPoints?: number
  badges?: string[]
  leaderboardOptIn?: boolean
  displayName?: string
  email?: string
  photoURL?: string
}

export async function apiCheckAdmin(token: string): Promise<boolean> {
  const res = await apiFetch('/api/users/me', { headers: await authHeaders(token) })
  if (!res.ok) return false
  const data = (await res.json()) as { admin?: boolean }
  return data.admin === true
}

export async function apiGetProfile(token: string): Promise<UserProfile | null> {
  const res = await apiFetch('/api/users/me', { headers: await authHeaders(token) })
  if (!res.ok) return null
  const data = await res.json()
  return data.user as UserProfile | null
}

export async function apiUpdateProfile(token: string, patch: { leaderboardOptIn?: boolean }) {
  const res = await apiFetch('/api/users/me', {
    method: 'PATCH',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) await parseApiError(res)
  return res.json() as Promise<{ ok: boolean; leaderboardOptIn?: boolean }>
}

export async function apiEnsureUser(token: string, profile: { displayName?: string; email?: string; photoURL?: string }) {
  const res = await apiFetch('/api/users/me', {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiDemoToken(role: 'citizen' | 'admin'): Promise<{ token: string; role: string }> {
  const res = await apiFetch('/api/auth/demo-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export type DepartmentScorecard = {
  departmentId: string
  total: number
  open: number
  resolved: number
  resolutionRate: number
  slaCompliance: number | null
  avgTurnaroundHours: number | null
  grade: 'A' | 'B' | 'C' | 'D'
  score: number
}

export async function apiScorecards(): Promise<{ scorecards: DepartmentScorecard[]; generatedAt: string }> {
  const res = await apiFetch('/api/analytics/scorecards')
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiVerifyResolution(
  id: string,
  proof: File,
  token: string,
): Promise<{ comparison: ProofComparison }> {
  const fd = new FormData()
  fd.append('proof', proof)
  const res = await apiFetch(`/api/reports/${id}/verify-resolution`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export type CivicNotification = {
  id: string
  userId: string
  issueId?: string
  type?: string
  title: string
  body: string
  bodyHi?: string
  read?: boolean
  createdAt: string
}

export async function apiListNotifications(token: string, limit = 30) {
  const res = await apiFetch(`/api/notifications?limit=${limit}`, {
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json() as Promise<{ notifications: CivicNotification[]; unreadCount: number }>
}

export async function apiMarkNotificationRead(id: string, token: string) {
  const res = await apiFetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}

export async function apiMarkAllNotificationsRead(token: string) {
  const res = await apiFetch('/api/notifications/read-all', {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) await parseApiError(res)
  return res.json()
}
