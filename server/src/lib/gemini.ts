import { GoogleGenerativeAI } from '@google/generative-ai'
import type { IssueAnalysis } from '../types/shared'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const ANALYSIS_PROMPT = `Analyze this civic issue image for an Indian urban context. Return ONLY valid JSON:
{"category":"pothole|water_leak|streetlight|waste|road_damage|drainage|signage|encroachment|other","severity":1-5,"title":"short title","description":"detail","department":"BBMP department name","safety_risk":boolean,"confidence":0-1,"estimated_fix_days":"e.g. 5-7 days"}`

export async function analyzeImage(
  buffer: Buffer,
  mimeType: string,
  hint?: string,
): Promise<IssueAnalysis> {
  if (!genAI) return fallbackAnalysis(hint)

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent([
      { text: ANALYSIS_PROMPT + (hint ? `\nContext: ${hint}` : '') },
      { inlineData: { data: buffer.toString('base64'), mimeType } },
    ])
    const text = result.response.text()
    const parsed = JSON.parse(text) as IssueAnalysis
    return { ...parsed, confidence: parsed.confidence ?? 0.85 }
  } catch {
    return fallbackAnalysis(hint)
  }
}

export async function chatWithTools(
  messages: { role: string; content: string }[],
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  if (!genAI) return 'AI assistant requires GEMINI_API_KEY on the server. Try browsing the map or my reports instead.'

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
  const system = `You are Civic Assistant for Community Hero — a hyperlocal civic reporting app. NEVER invent issue data. Use tools for facts. Be concise.`
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''

  if (last.includes('near me') || last.includes('nearby')) {
    const data = await toolHandler('findNearbyIssues', { radius_km: 5 })
    const items = Array.isArray(data) ? data : []
    if (!items.length) return 'No open issues found near your location in the last fetch. Try widening your search on the map.'
    return `Issues near you:\n${items.map((i: { title: string; status: string; category: string }) => `• ${i.title} (${i.category}, ${i.status})`).join('\n')}`
  }
  if (last.includes('my report') || last.includes('status')) {
    const data = await toolHandler('getMyReports', {})
    const items = Array.isArray(data) ? data : []
    if (!items.length) return "You haven't submitted any reports yet. Tap Report in the bottom nav to get started."
    return `Your reports:\n${items.map((i: { title: string; status: string }) => `• ${i.title} — ${i.status}`).join('\n')}`
  }
  if (last.includes('hotspot')) {
    const data = await toolHandler('getHotspots', {})
    const items = Array.isArray(data) ? data : []
    return items.length
      ? `Top hotspot clusters:\n${items.map((h: { geohash: string; count: number }) => `• ${h.geohash}: ${h.count} issues`).join('\n')}`
      : 'No hotspot clusters detected yet.'
  }
  if (last.includes('department') || last.includes('who fix')) {
    const data = await toolHandler('getDepartmentInfo', { category: 'pothole' })
    return `Road issues are typically handled by: ${JSON.stringify(data)}`
  }
  if (last.includes('how to report') || last.includes('garbage')) {
    return 'Tap Report in the bottom nav → photograph the issue → AI pre-fills details → confirm location → submit. Takes under 30 seconds.'
  }

  const result = await model.generateContent([
    system,
    ...messages.map((m) => `${m.role}: ${m.content}`),
  ])
  return result.response.text()
}

export async function generateInsight(summary: Record<string, unknown>): Promise<string> {
  if (!genAI) {
    return `Based on ${summary.open ?? 0} open and ${summary.resolved ?? 0} resolved issues nearby, waste and road categories often need the most attention. Preventive sweeps in high-density clusters are recommended.`
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
  const result = await model.generateContent(
    `Write 2 sentences of civic insight for a dashboard card. Data: ${JSON.stringify(summary)}. No hallucination beyond data.`,
  )
  return result.response.text()
}

function fallbackAnalysis(hint?: string): IssueAnalysis {
  const h = (hint || '').toLowerCase()
  let category: IssueAnalysis['category'] = 'other'
  if (h.includes('pothole') || h.includes('road')) category = 'pothole'
  else if (h.includes('water') || h.includes('leak')) category = 'water_leak'
  else if (h.includes('light')) category = 'streetlight'
  else if (h.includes('waste') || h.includes('garbage')) category = 'waste'

  return {
    category,
    severity: 4,
    title: hint || 'Civic issue reported',
    description: 'AI analysis pending — please verify details.',
    department: 'Roads & Infrastructure',
    safety_risk: category === 'pothole',
    confidence: 0.75,
    estimated_fix_days: '5-7 days',
  }
}
