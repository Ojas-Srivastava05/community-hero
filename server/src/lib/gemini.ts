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

/** Appendix V — all 7 citizen assistant tools */
const CIVIC_TOOLS: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: 'findNearbyIssues',
        description: 'Find open civic issues near the user location',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            lat: { type: SchemaType.NUMBER, description: 'Latitude' },
            lng: { type: SchemaType.NUMBER, description: 'Longitude' },
            radius_km: { type: SchemaType.NUMBER, description: 'Search radius in kilometers' },
            status: { type: SchemaType.STRING, description: 'Optional status filter e.g. Submitted, Resolved' },
          },
        },
      },
      {
        name: 'getIssueById',
        description: 'Get full details for a specific issue by ID',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            issue_id: { type: SchemaType.STRING, description: 'Issue document ID' },
          },
          required: ['issue_id'],
        },
      },
      {
        name: 'searchIssues',
        description: 'Search issues by keyword in title, description, or category',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Search keywords' },
            ward_id: { type: SchemaType.STRING, description: 'Optional ward filter' },
          },
          required: ['query'],
        },
      },
      {
        name: 'getHotspots',
        description: 'Get top geohash hotspot clusters with high issue density',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ward_id: { type: SchemaType.STRING, description: 'Optional ward filter' },
          },
        },
      },
      {
        name: 'getMyReports',
        description: "List the current user's submitted reports and their statuses",
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'getDepartmentInfo',
        description: 'Get department name, SLA hours, and contact info for a category or department',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            department_id: { type: SchemaType.STRING, description: 'Category key or department name e.g. pothole, waste' },
          },
          required: ['department_id'],
        },
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

const SYSTEM_PROMPT = `You are Civic Assistant for Community Hero — a hyperlocal civic reporting app in India.
CRITICAL RULES:
- NEVER invent issue data, counts, IDs, or department details.
- ALWAYS call the appropriate tool before stating facts about issues, departments, or hotspots.
- If a tool returns empty or null, say you found no matching data — do not guess.
- Be concise and helpful. Respond in English or Hindi based on the user's language.`

/** Detect Devanagari (Hindi) script in user text */
export function isHindiMessage(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}

function hiPrefix(): string {
  return '🇮🇳 हिंदी: '
}

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
  const last = messages[messages.length - 1]?.content || ''
  const lastLower = last.toLowerCase()
  const hindi = isHindiMessage(last)
  const prefix = hindi ? hiPrefix() : ''

  if (lastLower.includes('near me') || lastLower.includes('nearby') || last.includes('पास') || last.includes('आस')) {
    const data = await toolHandler('findNearbyIssues', { radius_km: 5 })
    const items = Array.isArray(data) ? data : []
    if (!items.length) {
      return prefix + (hindi
        ? 'आपके स्थान के पास कोई खुला मुद्दा नहीं मिला।'
        : 'No open issues found near your location in the last fetch. Try widening your search on the map.')
    }
    const lines = items.map((i: { title: string; status: string; category: string }) => `• ${i.title} (${i.category}, ${i.status})`).join('\n')
    return prefix + (hindi ? `आपके पास के मुद्दे:\n${lines}` : `Issues near you:\n${lines}`)
  }
  if (lastLower.includes('my report') || lastLower.includes('status') || last.includes('मेरी रिपोर्ट')) {
    const data = await toolHandler('getMyReports', {})
    const items = Array.isArray(data) ? data : []
    if (!items.length) {
      return prefix + (hindi ? 'आपने अभी तक कोई रिपोर्ट नहीं की है।' : "You haven't submitted any reports yet. Tap Report in the bottom nav to get started.")
    }
    const lines = items.map((i: { title: string; status: string }) => `• ${i.title} — ${i.status}`).join('\n')
    return prefix + (hindi ? `आपकी रिपोर्ट:\n${lines}` : `Your reports:\n${lines}`)
  }
  if (lastLower.includes('hotspot') || last.includes('हॉटस्पॉट')) {
    const data = await toolHandler('getHotspots', {})
    const items = Array.isArray(data) ? data : []
    return prefix + (items.length
      ? (hindi ? `शीर्ष हॉटस्पॉट:\n${items.map((h: { geohash: string; count: number }) => `• ${h.geohash}: ${h.count} मुद्दे`).join('\n')}`
        : `Top hotspot clusters:\n${items.map((h: { geohash: string; count: number }) => `• ${h.geohash}: ${h.count} issues`).join('\n')}`)
      : (hindi ? 'अभी कोई हॉटस्पॉट नहीं मिला।' : 'No hotspot clusters detected yet.'))
  }
  if (lastLower.includes('search') || lastLower.includes('find') || last.includes('खोज')) {
    const q = last.replace(/search|find|खोज/gi, '').trim() || 'pothole'
    const data = await toolHandler('searchIssues', { query: q })
    const items = Array.isArray(data) ? data : []
    return prefix + (items.length
      ? (hindi ? `खोज परिणाम:\n${items.map((i: { title: string }) => `• ${i.title}`).join('\n')}`
        : `Search results:\n${items.map((i: { title: string }) => `• ${i.title}`).join('\n')}`)
      : (hindi ? 'कोई मिलान नहीं मिला।' : 'No matching issues found.'))
  }
  if (lastLower.includes('department') || lastLower.includes('sla') || last.includes('विभाग')) {
    const data = await toolHandler('getDepartmentInfo', { department_id: 'pothole' })
    return prefix + JSON.stringify(data, null, 2)
  }
  if (lastLower.includes('how to report') || lastLower.includes('garbage') || last.includes('रिपोर्ट कैसे')) {
    return prefix + (hindi
      ? 'नीचे Report टैप करें → फोटो लें → AI विवरण भरेगा → स्थान पुष्टि करें → सबमिट करें।'
      : 'Tap Report in the bottom nav → photograph the issue → AI pre-fills details → confirm location → submit. Takes under 30 seconds.')
  }

  return prefix + (hindi
    ? 'AI सहायक के लिए GEMINI_API_KEY आवश्यक है। नक्शा या मेरी रिपोर्ट देखें।'
    : 'AI assistant requires GEMINI_API_KEY on the server. Try asking about issues near me, my reports, or hotspots — those work without full AI.')
}

export async function chatWithTools(
  messages: { role: string; content: string }[],
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const hindi = isHindiMessage(lastMessage)

  if (!genAI) return keywordFallback(messages, toolHandler)

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      tools: CIVIC_TOOLS,
      systemInstruction: SYSTEM_PROMPT + (hindi ? '\nRespond in Hindi when the user writes in Hindi.' : ''),
    })

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const chat = model.startChat({ history })

    let result = await chat.sendMessage(lastMessage)
    let response = result.response

    for (let i = 0; i < 5; i++) {
      const calls = response.functionCalls()
      if (!calls?.length) break

      const functionResponses = []
      for (const call of calls) {
        const normalizedArgs = { ...(call.args || {}) } as Record<string, unknown>
        if (call.name === 'getIssueById' && normalizedArgs.issue_id === undefined && normalizedArgs.id) {
          normalizedArgs.issue_id = normalizedArgs.id
        }
        const toolResult = await toolHandler(call.name, normalizedArgs)
        const wrapped = hindi
          ? { result: toolResult, locale: 'hi', prefix: hiPrefix() }
          : { result: toolResult }
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: wrapped,
          },
        })
      }
      result = await chat.sendMessage(functionResponses)
      response = result.response
    }

    const text = response.text() || (hindi ? 'उत्तर नहीं बना। कृपया फिर से पूछें।' : 'I could not generate a response. Try rephrasing your question.')
    return hindi && !text.startsWith(hiPrefix()) ? hiPrefix() + text : text
  } catch (e) {
    const msg = String(e)
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('depleted')) {
      return keywordFallback(messages, toolHandler)
    }
    try {
      return await keywordFallback(messages, toolHandler)
    } catch {
      return hindi
        ? 'AI सहायक अस्थायी रूप से अनुपलब्ध है।'
        : 'The AI assistant is temporarily unavailable. Try browsing the map or my reports instead.'
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

export async function generateTrendNarrative(trends: Record<string, unknown>): Promise<string> {
  if (!genAI) {
    const byCategory = trends.byCategory as Record<string, number> | undefined
    const top = byCategory ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] : undefined
    return top
      ? `${top[0].replace(/_/g, ' ')} leads with ${top[1]} reports in the current window.`
      : 'Trend data is building as citizens report issues.'
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent(
    `Write 2-3 sentences summarizing civic issue trends for a dashboard. Data only — no invention: ${JSON.stringify(trends)}`,
  )
  return result.response.text()
}

export async function compareBeforeAfter(
  beforeBuffer: Buffer,
  afterBuffer: Buffer,
  beforeMime: string,
  afterMime: string,
): Promise<{ improved: boolean; summary: string }> {
  if (!genAI) {
    return { improved: true, summary: 'Resolution proof uploaded. AI comparison requires GEMINI_API_KEY.' }
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent([
    { text: 'Compare before/after civic repair photos. Return JSON: {"improved":boolean,"summary":"one sentence"}' },
    { inlineData: { data: beforeBuffer.toString('base64'), mimeType: beforeMime } },
    { inlineData: { data: afterBuffer.toString('base64'), mimeType: afterMime } },
  ])
  try {
    return JSON.parse(result.response.text()) as { improved: boolean; summary: string }
  } catch {
    return { improved: true, summary: result.response.text() || 'Repair documented.' }
  }
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
