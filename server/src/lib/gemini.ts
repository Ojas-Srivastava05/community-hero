import { GoogleGenerativeAI, SchemaType, type FunctionDeclarationsTool } from '@google/generative-ai'
import type { IssueAnalysis } from '../types/shared'
import { ApiError, ErrorCodes, isApiError } from './errors'
import { getCachedAnalysis, setCachedAnalysis, sha256 } from './geminiCache'

const ALLOWED_IMAGE_MIMES = /^image\/(jpeg|png|webp|gif|heic|heif)$/i
const MIN_IMAGE_BYTES = 1024

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const ANALYSIS_PROMPT = `Analyze this civic issue image for an Indian urban context. Return ONLY valid JSON:
{"category":"pothole|water_leak|streetlight|waste|road_damage|drainage|signage|encroachment|other","severity":1-5,"title":"short title","description":"detail","department":"BBMP department name","safety_risk":boolean,"confidence":0-1,"estimated_fix_days":"e.g. 5-7 days"}`

const CIVIC_TOOLS: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: 'findNearbyIssues',
        description: 'Find open civic issues near the user location',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            radius_km: { type: SchemaType.NUMBER, description: 'Search radius in kilometers' },
          },
        },
      },
      {
        name: 'getIssueById',
        description: 'Get full details for a specific issue by ID',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING, description: 'Issue document ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'getMyReports',
        description: "List the current user's submitted reports and their statuses",
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'getHotspots',
        description: 'Get top geohash hotspot clusters with high issue density',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'explainStatus',
        description: 'Explain what a civic issue status means for citizens',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              description: 'Issue status e.g. Submitted, Community Verified, Resolved',
            },
          },
          required: ['status'],
        },
      },
    ],
  },
]

export async function analyzeImage(
  buffer: Buffer,
  mimeType: string,
  hint?: string,
): Promise<IssueAnalysis> {
  if (buffer.length < MIN_IMAGE_BYTES) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Image too small or blank')
  }
  if (!ALLOWED_IMAGE_MIMES.test(mimeType)) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Unsupported image type')
  }

  const hash = sha256(buffer)
  const cached = getCachedAnalysis(hash)
  if (cached) return cached

  if (!genAI) {
    const analysis = fallbackAnalysis(hint)
    setCachedAnalysis(hash, analysis)
    return analysis
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent([
      { text: ANALYSIS_PROMPT + (hint ? `\nContext: ${hint}` : '') },
      { inlineData: { data: buffer.toString('base64'), mimeType } },
    ])
    const text = result.response.text()
    const parsed = JSON.parse(text) as IssueAnalysis
    const analysis = { ...parsed, confidence: parsed.confidence ?? 0.85 }
    setCachedAnalysis(hash, analysis)
    return analysis
  } catch (e) {
    if (isApiError(e)) throw e
    const analysis = fallbackAnalysis(hint)
    setCachedAnalysis(hash, analysis)
    return analysis
  }
}

async function keywordFallback(
  messages: { role: string; content: string }[],
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
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
  if (last.includes('how to report') || last.includes('garbage')) {
    return 'Tap Report in the bottom nav → photograph the issue → AI pre-fills details → confirm location → submit. Takes under 30 seconds.'
  }

  return 'AI assistant requires GEMINI_API_KEY on the server. Try asking about issues near me, my reports, or hotspots — those work without full AI.'
}

export async function chatWithTools(
  messages: { role: string; content: string }[],
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  const system = `You are Civic Assistant for Community Hero — a hyperlocal civic reporting app. NEVER invent issue data. Use tools for facts. Be concise.`

  if (!genAI) return keywordFallback(messages, toolHandler)

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      tools: CIVIC_TOOLS,
      systemInstruction: system,
    })

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const lastMessage = messages[messages.length - 1]?.content || ''
    const chat = model.startChat({ history })

    let result = await chat.sendMessage(lastMessage)
    let response = result.response

    for (let i = 0; i < 5; i++) {
      const calls = response.functionCalls()
      if (!calls?.length) break

      const functionResponses = []
      for (const call of calls) {
        const toolResult = await toolHandler(call.name, (call.args || {}) as Record<string, unknown>)
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        })
      }
      result = await chat.sendMessage(functionResponses)
      response = result.response
    }

    return response.text() || 'I could not generate a response. Try rephrasing your question.'
  } catch (e) {
    const msg = String(e)
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('depleted')) {
      return keywordFallback(messages, toolHandler)
    }
    try {
      return await keywordFallback(messages, toolHandler)
    } catch {
      return 'The AI assistant is temporarily unavailable. Try browsing the map or my reports instead.'
    }
  }
}

export async function generateInsight(summary: Record<string, unknown>): Promise<string> {
  if (!genAI) {
    return `Based on ${summary.open ?? 0} open and ${summary.resolved ?? 0} resolved issues nearby, waste and road categories often need the most attention. Preventive sweeps in high-density clusters are recommended.`
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
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
