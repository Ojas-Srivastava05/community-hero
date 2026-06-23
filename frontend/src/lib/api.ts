import type { Issue, IssueAnalysis } from '../../../shared/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path: string, init?: RequestInit, retries = 3): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.ok || res.status < 500) return res
      lastError = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastError = e
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API unavailable — server may be waking up')
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
): Promise<{ analysis: IssueAnalysis }> {
  const fd = new FormData()
  fd.append('image', file)
  if (hint) fd.append('hint', hint)
  const res = await apiFetch('/api/reports/analyze', {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) throw new Error(await res.text())
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
  },
  images: File[],
  token: string,
): Promise<{ id: string; issue: Issue }> {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, String(v)))
  images.forEach((img) => fd.append('images', img))
  const res = await apiFetch('/api/reports', {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiListIssues(limit = 50): Promise<{ issues: Issue[] }> {
  const res = await apiFetch(`/api/reports?limit=${limit}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiMyReports(token: string): Promise<{ issues: Issue[] }> {
  const res = await apiFetch('/api/reports/mine', { headers: await authHeaders(token) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiGetIssue(id: string): Promise<{ issue: Issue; events: unknown[] }> {
  const res = await apiFetch(`/api/reports/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiUpvote(id: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/upvote`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiUpdateStatus(id: string, status: string, token: string) {
  const res = await apiFetch(`/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiAnalyticsSummary() {
  const res = await apiFetch('/api/analytics/summary')
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiHotspots() {
  const res = await apiFetch('/api/analytics/hotspots')
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiChat(messages: { role: string; content: string }[], token: string, lat?: number, lng?: number) {
  const res = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, lat, lng }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiLeaderboard() {
  const res = await apiFetch('/api/leaderboard')
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
