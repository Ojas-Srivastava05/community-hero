import { GoogleGenerativeAI, SchemaType, type FunctionDeclarationsTool } from '@google/generative-ai'
import type { IssueAnalysis, Category } from '../types/shared'
import { DEPARTMENTS } from '../types/shared'
import { ApiError, ErrorCodes, isApiError } from './errors'
import { getCachedAnalysis, setCachedAnalysis, sha256 } from './geminiCache'
import { isVertexPreferred, liteModel, vertexChat, vertexGenerateContent, vertexTextModel } from './vertex-gemini'

const ALLOWED_IMAGE_MIMES = /^image\/(jpeg|png|webp|gif|heic|heif)$/i
const MIN_IMAGE_BYTES = 1024

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export const GEMINI_MODEL_VISION = process.env.GEMINI_MODEL_VISION || 'gemini-2.5-flash'
export const GEMINI_MODEL_LITE = process.env.GEMINI_MODEL_LITE || 'gemini-2.5-flash-lite'

const ANALYSIS_PROMPT = `Analyze this civic issue image for an Indian urban context. Look for: garbage dumps, illegal waste dumping, litter piles, potholes, water leaks, broken streetlights, drainage floods, road damage, encroachment.
Return ONLY valid JSON:
{"category":"pothole|water_leak|streetlight|waste|road_damage|drainage|signage|encroachment|other","severity":1-5,"title":"short title","description":"detail","department":"BBMP department name","safety_risk":boolean,"confidence":0-1,"estimated_fix_days":"e.g. 5-7 days"}
For obvious illegal dumping / large garbage piles use category waste, severity 4-5, confidence 0.9+.`

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

export type VisionSource = 'gemini' | 'vertex' | 'cache' | 'degraded_keyword' | 'degraded_unknown'

export type AnalyzeImageResult = {
  analysis: IssueAnalysis
  visionSource: VisionSource
}

const CATEGORY_KEYWORDS: { category: Category; words: string[] }[] = [
  { category: 'waste', words: ['waste', 'garbage', 'trash', 'rubbish', 'litter', 'dump', 'dumping', 'landfill', 'styrofoam', 'plastic', 'filth', 'sanitation', 'bin'] },
  { category: 'pothole', words: ['pothole', 'potholes', 'crater', 'road hole'] },
  { category: 'road_damage', words: ['road damage', 'cracked road', 'broken road', 'asphalt'] },
  { category: 'water_leak', words: ['water leak', 'leak', 'pipe burst', 'sewage', 'overflow'] },
  { category: 'drainage', words: ['drain', 'drainage', 'stormwater', 'flood', 'flooding', 'clogged'] },
  { category: 'streetlight', words: ['streetlight', 'street light', 'lamp', 'light pole', 'dark street'] },
  { category: 'signage', words: ['signage', 'sign board', 'billboard', 'traffic sign'] },
  { category: 'encroachment', words: ['encroach', 'illegal stall', 'hawker', 'footpath'] },
]

function classifyFromHint(hint?: string): { category: Category; matchStrength: 'strong' | 'weak' | 'none'; title: string } {
  const h = (hint || '').toLowerCase().trim()
  if (!h) return { category: 'other', matchStrength: 'none', title: 'Civic issue reported' }

  let best: Category = 'other'
  let bestScore = 0
  for (const row of CATEGORY_KEYWORDS) {
    const score = row.words.filter((w) => h.includes(w)).length
    if (score > bestScore) {
      bestScore = score
      best = row.category
    }
  }
  if (bestScore >= 2 || (bestScore === 1 && best !== 'other')) {
    const title =
      best === 'waste'
        ? 'Illegal waste dumping / garbage accumulation'
        : hint!.slice(0, 80)
    return { category: best, matchStrength: 'strong', title }
  }
  if (bestScore === 1) {
    return { category: best, matchStrength: 'weak', title: hint!.slice(0, 80) }
  }
  return { category: 'other', matchStrength: 'none', title: hint!.slice(0, 80) }
}

function smartFallbackAnalysis(hint?: string): AnalyzeImageResult {
  const { category, matchStrength, title } = classifyFromHint(hint)
  const dept = DEPARTMENTS[category]?.name ?? 'General Civic'
  const severity =
    category === 'waste' && matchStrength === 'strong'
      ? 5
      : matchStrength === 'strong'
        ? 4
        : matchStrength === 'weak'
          ? 3
          : 3
  const confidence =
    matchStrength === 'strong' ? 0.88 : matchStrength === 'weak' ? 0.8 : 0.58
  const visionSource: VisionSource =
    matchStrength === 'none' ? 'degraded_unknown' : 'degraded_keyword'

  return {
    visionSource,
    analysis: {
      category,
      severity,
      title,
      description:
        matchStrength === 'none'
          ? 'Vision AI was busy — add a short description (e.g. “garbage dump”) for accurate routing.'
          : `${title}. Classified from your description while vision AI was busy — please verify.`,
      department: dept,
      safety_risk: category === 'pothole' || (category === 'waste' && severity >= 4),
      confidence,
      estimated_fix_days: category === 'waste' ? '2-4 days' : '5-7 days',
    },
  }
}

export async function analyzeImage(
  buffer: Buffer,
  mimeType: string,
  hint?: string,
): Promise<AnalyzeImageResult> {
  if (buffer.length < MIN_IMAGE_BYTES) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Image too small or blank')
  }
  if (!ALLOWED_IMAGE_MIMES.test(mimeType)) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Unsupported image type')
  }

  const hash = sha256(buffer)
  const cached = getCachedAnalysis(hash)
  if (cached && (cached.confidence ?? 0) >= 0.65) {
    return { analysis: cached, visionSource: 'cache' }
  }

  const prompt = ANALYSIS_PROMPT + (hint ? `\nContext: ${hint}` : '')
  const imagePart = { inlineData: { data: buffer.toString('base64'), mimeType } }

  const tryVertex = async (): Promise<AnalyzeImageResult | null> => {
    try {
      const text = await vertexGenerateContent([{ text: prompt }, imagePart], { json: true })
      const parsed = JSON.parse(text) as IssueAnalysis
      const analysis = { ...parsed, confidence: parsed.confidence ?? 0.88 }
      setCachedAnalysis(hash, analysis)
      return { analysis, visionSource: 'vertex' }
    } catch (e) {
      console.warn('Vertex vision failed:', e)
      return null
    }
  }

  const tryApiKey = async (): Promise<AnalyzeImageResult | null> => {
    if (!genAI) return null
    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL_VISION,
        generationConfig: { responseMimeType: 'application/json' },
      })
      const result = await model.generateContent([{ text: prompt }, imagePart])
      const text = result.response.text()
      const parsed = JSON.parse(text) as IssueAnalysis
      const analysis = { ...parsed, confidence: parsed.confidence ?? 0.85 }
      setCachedAnalysis(hash, analysis)
      return { analysis, visionSource: 'gemini' }
    } catch (e) {
      if (isApiError(e)) throw e
      console.warn('AI Studio vision failed:', e)
      return null
    }
  }

  // Production: Vertex first (GCP billing). AI Studio prepay credits may be empty.
  if (isVertexPreferred()) {
    const vertex = await tryVertex()
    if (vertex) return vertex
    const api = await tryApiKey()
    if (api) return api
  } else {
    const api = await tryApiKey()
    if (api) return api
    const vertex = await tryVertex()
    if (vertex) return vertex
  }

  const fb = smartFallbackAnalysis(hint)
  // Do not cache degraded fallbacks — they block real Vertex/Gemini on retry
  return fb
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
  if (lastLower.includes('explain status') || lastLower.includes('explain submitted') || (lastLower.includes('what does') && lastLower.includes('status')) || last.includes('मतलब')) {
    const statusMatch = last.match(
      /Submitted|Community Verified|Assigned|In Progress|Resolved|Closed/i,
    )
    const status = statusMatch?.[0] || 'Submitted'
    const data = (await toolHandler('explainStatus', { status })) as { explanation?: string; status?: string }
    return prefix + (hindi
      ? `${data.status || status}: ${data.explanation || 'स्थिति अपडेट।'}`
      : `${data.status || status}: ${data.explanation || 'Status updated.'}`)
  }
  const issueIdMatch = last.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (issueIdMatch || lastLower.includes('issue id') || lastLower.includes('issue #')) {
    const issueId = issueIdMatch?.[0] || last.replace(/.*issue\s*(?:id|#)?\s*/i, '').trim().split(/\s+/)[0]
    if (issueId) {
      const data = (await toolHandler('getIssueById', { issue_id: issueId })) as { error?: string; title?: string; status?: string; id?: string }
      if (data?.error === 'NOT_FOUND') {
        return prefix + (hindi
          ? `ID ${issueId} के लिए कोई मुद्दा नहीं मिला — डेटा नहीं बनाया गया।`
          : `No issue found for ID ${issueId} — not inventing data.`)
      }
      return prefix + (hindi
        ? `${data.title || 'मुद्दा'} (${data.status || 'अज्ञात'}) — ID: ${data.id || issueId}`
        : `${data.title || 'Issue'} (${data.status || 'unknown'}) — ID: ${data.id || issueId}`)
    }
  }
  if (lastLower.includes('my report') || lastLower.includes('status') || last.includes('मेरी रिपोर्ट') || last.includes('स्थिति')) {
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
    const data = (await toolHandler('getDepartmentInfo', { department_id: 'pothole' })) as {
      name?: string
      sla_hours?: number
      contact?: string
    }
    return prefix + (hindi
      ? `${data.name || 'विभाग'} — SLA: ${data.sla_hours ?? '?'} घंटे। ${data.contact || ''}`
      : `${data.name || 'Department'} — SLA: ${data.sla_hours ?? '?'} hours. ${data.contact || ''}`)
  }
  if (lastLower.includes('how to report') || lastLower.includes('garbage') || last.includes('रिपोर्ट कैसे')) {
    return prefix + (hindi
      ? 'नीचे Report टैप करें → फोटो लें → AI विवरण भरेगा → स्थान पुष्टि करें → सबमिट करें।'
      : 'Tap Report in the bottom nav → photograph the issue → AI pre-fills details → confirm location → submit. Takes under 30 seconds.')
  }

  return prefix + (hindi
    ? 'मैं नक्शा, आपकी रिपोर्ट, या हॉटस्पॉट के बारे में मदद कर सकता/सकती हूँ। जैसे: "मेरे पास क्या मुद्दे हैं?"'
    : 'I can help with issues near you, your reports, hotspots, or how to file a report. Try: "issues near me" or "my reports".')
}

/** Prefetch live civic data for Vertex chat (no function-calling on Vertex lite). */
async function prefetchToolContext(
  last: string,
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  const lower = last.toLowerCase()
  const blocks: string[] = []

  const add = async (label: string, fn: () => Promise<unknown>) => {
    try {
      const data = await fn()
      blocks.push(`${label}:\n${JSON.stringify(data).slice(0, 2500)}`)
    } catch {
      blocks.push(`${label}: (unavailable)`)
    }
  }

  await Promise.all([
    add('findNearbyIssues', () => toolHandler('findNearbyIssues', { radius_km: 8 })),
    add('getMyReports', () => toolHandler('getMyReports', {})),
    add('getHotspots', () => toolHandler('getHotspots', {})),
  ])

  if (lower.includes('search') || lower.includes('find') || lower.includes('pothole') || lower.includes('garbage') || lower.includes('waste')) {
    const q = last.replace(/search|find/gi, '').trim() || 'civic'
    await add('searchIssues', () => toolHandler('searchIssues', { query: q }))
  }
  const issueIdMatch = last.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (issueIdMatch) {
    await add('getIssueById', () => toolHandler('getIssueById', { issue_id: issueIdMatch[0] }))
  }
  if (lower.includes('department') || lower.includes('sla')) {
    await add('getDepartmentInfo', () => toolHandler('getDepartmentInfo', { department_id: 'waste' }))
  }
  if (lower.includes('status') || lower.includes('explain')) {
    const statusMatch = last.match(/Submitted|Community Verified|Assigned|In Progress|Resolved|Closed/i)
    await add('explainStatus', () => toolHandler('explainStatus', { status: statusMatch?.[0] || 'Submitted' }))
  }

  return blocks.join('\n\n')
}

async function vertexChatGrounded(
  messages: { role: string; content: string }[],
  systemInstruction: string,
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  const last = messages[messages.length - 1]?.content || ''
  const toolContext = await prefetchToolContext(last, toolHandler)
  const history = messages
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n')
  const prompt = `LIVE TOOL DATA (only source of truth — never invent beyond this):\n${toolContext}\n\nConversation:\n${history}\n\nReply to the latest user message. Be concise, friendly, and cite real data from LIVE TOOL DATA only.`

  return vertexGenerateContent([{ text: prompt }], {
    model: vertexTextModel(),
    systemInstruction,
  })
}

export async function chatWithTools(
  messages: { role: string; content: string }[],
  toolHandler: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const hindi = isHindiMessage(lastMessage)
  const systemInstruction = SYSTEM_PROMPT + (hindi ? '\nRespond in Hindi when the user writes in Hindi.' : '')

  if (isVertexPreferred()) {
    try {
      return await vertexChatGrounded(messages, systemInstruction, toolHandler)
    } catch (e) {
      console.warn('Vertex grounded chat failed:', e)
      try {
        const text = await vertexChat(messages, systemInstruction)
        return hindi && !text.startsWith(hiPrefix()) ? hiPrefix() + text : text
      } catch (e2) {
        console.warn('Vertex chat failed:', e2)
      }
    }
  }

  if (!genAI) return keywordFallback(messages, toolHandler)

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_LITE,
      tools: CIVIC_TOOLS,
      systemInstruction,
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
  const prompt = `Write 2 sentences of civic insight for a dashboard card. Data: ${JSON.stringify(summary)}. No hallucination beyond data.`
  const fallback = `Based on ${summary.open ?? 0} open and ${summary.resolved ?? 0} resolved issues nearby, waste and road categories often need the most attention. Preventive sweeps in high-density clusters are recommended.`

  if (isVertexPreferred()) {
    try {
      return await vertexGenerateContent([{ text: prompt }], { model: vertexTextModel() })
    } catch (e) {
      console.warn('Vertex insight failed:', e)
    }
  }
  if (!genAI) return fallback
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_LITE })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch {
    return fallback
  }
}

export async function generateTrendNarrative(trends: Record<string, unknown>): Promise<string> {
  const byCategory = trends.byCategory as Record<string, number> | undefined
  const top = byCategory ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] : undefined
  const fallback = top
    ? `${top[0].replace(/_/g, ' ')} leads with ${top[1]} reports in the current window.`
    : 'Trend data is building as citizens report issues.'
  const prompt = `Write 2-3 sentences summarizing civic issue trends for a dashboard. Data only — no invention: ${JSON.stringify(trends)}`

  if (isVertexPreferred()) {
    try {
      return await vertexGenerateContent([{ text: prompt }], { model: vertexTextModel() })
    } catch (e) {
      console.warn('Vertex trend narrative failed:', e)
    }
  }
  if (!genAI) return fallback
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_LITE })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch {
    return fallback
  }
}

export async function compareBeforeAfter(
  beforeBuffer: Buffer,
  afterBuffer: Buffer,
  beforeMime: string,
  afterMime: string,
): Promise<{ improved: boolean; summary: string; confidence: number }> {
  const prompt = `Compare BEFORE and AFTER civic repair photos. Return JSON only:
{"improved":boolean,"summary":"one sentence for citizens","confidence":0.0-1.0}
improved=true only if the AFTER photo shows the reported issue is clearly fixed.`
  const parts = [
    { text: prompt },
    { inlineData: { data: beforeBuffer.toString('base64'), mimeType: beforeMime } },
    { inlineData: { data: afterBuffer.toString('base64'), mimeType: afterMime } },
  ]
  const parseResult = (raw: { improved?: boolean; summary?: string; confidence?: number }, textFallback?: string) => ({
    improved: Boolean(raw.improved),
    summary: raw.summary || textFallback || 'Repair documented.',
    confidence: typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.7,
  })

  if (isVertexPreferred()) {
    try {
      const text = await vertexGenerateContent(parts, { json: true })
      return parseResult(JSON.parse(text) as { improved?: boolean; summary?: string; confidence?: number })
    } catch (e) {
      console.warn('Vertex compare failed:', e)
    }
  }

  if (!genAI) {
    return {
      improved: true,
      summary: 'Resolution proof uploaded. AI comparison requires GEMINI_API_KEY.',
      confidence: 0.5,
    }
  }
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_VISION,
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent(parts)
    try {
      return parseResult(JSON.parse(result.response.text()) as { improved?: boolean; summary?: string; confidence?: number })
    } catch {
      return { improved: true, summary: result.response.text() || 'Repair documented.', confidence: 0.6 }
    }
  } catch {
    return {
      improved: true,
      summary: 'Resolution proof uploaded. AI vision comparison unavailable — manual review recommended.',
      confidence: 0.45,
    }
  }
}

function fallbackAnalysis(hint?: string): IssueAnalysis {
  return smartFallbackAnalysis(hint).analysis
}

/** Transcribe a civic voice note into title + description for the report wizard. */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<{ transcript: string; title: string; description: string }> {
  const mime = mimeType.split(';')[0] || 'audio/webm'
  const prompt = `Transcribe this Indian civic issue voice note. Return JSON only:
{"transcript":"full transcript","title":"short civic title ≤8 words","description":"1-2 sentence issue description for municipal staff"}
If audio is unclear, still return best-effort transcript.`
  const parts = [
    { text: prompt },
    { inlineData: { data: buffer.toString('base64'), mimeType: mime } },
  ]
  const parseTranscript = (raw: { transcript?: string; title?: string; description?: string }, textFallback?: string) => ({
    transcript: raw.transcript || textFallback || '',
    title: raw.title || 'Voice civic report',
    description: raw.description || raw.transcript || textFallback || '',
  })

  if (isVertexPreferred()) {
    try {
      const text = await vertexGenerateContent(parts, { json: true })
      return parseTranscript(JSON.parse(text) as { transcript?: string; title?: string; description?: string })
    } catch (e) {
      console.warn('Vertex transcribe failed:', e)
    }
  }

  if (!genAI) {
    return {
      transcript: '',
      title: 'Voice report',
      description: 'Audio transcription requires GEMINI_API_KEY.',
    }
  }
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_VISION,
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent(parts)
    try {
      return parseTranscript(JSON.parse(result.response.text()) as { transcript?: string; title?: string; description?: string })
    } catch {
      const text = result.response.text().trim()
      return parseTranscript({}, text)
    }
  } catch {
    return {
      transcript: '',
      title: 'Voice report',
      description: 'Audio transcription temporarily unavailable.',
    }
  }
}
