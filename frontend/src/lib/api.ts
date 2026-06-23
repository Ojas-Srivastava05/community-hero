import type { Issue, IssueAnalysis } from '../../../shared/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

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
  const res = await fetch(`${API_BASE}/api/reports/analyze`, {
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
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: await authHeaders(token),
    body: fd,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiListIssues(limit = 50): Promise<{ issues: Issue[] }> {
  const res = await fetch(`${API_BASE}/api/reports?limit=${limit}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiMyReports(token: string): Promise<{ issues: Issue[] }> {
  const res = await fetch(`${API_BASE}/api/reports/mine`, { headers: await authHeaders(token) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiGetIssue(id: string): Promise<{ issue: Issue; events: unknown[] }> {
  const res = await fetch(`${API_BASE}/api/reports/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiUpvote(id: string, token: string) {
  const res = await fetch(`${API_BASE}/api/reports/${id}/upvote`, {
    method: 'POST',
    headers: await authHeaders(token),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiUpdateStatus(id: string, status: string, token: string) {
  const res = await fetch(`${API_BASE}/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiAnalyticsSummary() {
  const res = await fetch(`${API_BASE}/api/analytics/summary`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiHotspots() {
  const res = await fetch(`${API_BASE}/api/analytics/hotspots`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiChat(messages: { role: string; content: string }[], token: string, lat?: number, lng?: number) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { ...(await authHeaders(token)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, lat, lng }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
