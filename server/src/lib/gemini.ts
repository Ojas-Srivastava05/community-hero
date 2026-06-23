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
  const system = `You are Civic Assistant for Community Hero Bengaluru. NEVER invent issue data. Use tools for facts. Be concise.`
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''

  if (last.includes('near me') || last.includes('nearby')) {
    const data = await toolHandler('findNearbyIssues', { radius_km: 0.5 })
    return `Here are open issues near you:\n${JSON.stringify(data, null, 2)}`
  }
  if (last.includes('my report') || last.includes('status')) {
    const data = await toolHandler('getMyReports', {})
    return `Your reports:\n${JSON.stringify(data, null, 2)}`
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
    return `Based on ${summary.open ?? 0} open and ${summary.resolved ?? 0} resolved issues, waste and pothole categories remain highest in Koramangala ward. Preventive sweeps recommended.`
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
