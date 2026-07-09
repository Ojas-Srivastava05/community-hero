import { GoogleAuth } from 'google-auth-library'

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })

function projectId(): string {
  return process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'community-hero-vibe2ship'
}

function region(): string {
  return process.env.GCP_REGION || 'asia-south1'
}

export function visionModel(): string {
  return process.env.GEMINI_MODEL_VISION || 'gemini-2.5-flash'
}

export function liteModel(): string {
  return process.env.GEMINI_MODEL_LITE || 'gemini-2.5-flash-lite'
}

/** Vertex regional endpoints — flash-lite is often unavailable; use flash for text/chat. */
export function vertexTextModel(): string {
  const requested = process.env.GEMINI_MODEL_VERTEX_TEXT || process.env.GEMINI_MODEL_LITE || 'gemini-2.5-flash'
  if (/lite/i.test(requested)) return 'gemini-2.5-flash'
  return requested
}

export function isVertexPreferred(): boolean {
  return process.env.GEMINI_USE_VERTEX === '1' || process.env.NODE_ENV === 'production'
}

export function isGeminiBillingError(message: string): boolean {
  return /depleted|RESOURCE_EXHAUSTED|quota|billing|prepay/i.test(message)
}

export interface VertexGenerateOptions {
  json?: boolean
  model?: string
  systemInstruction?: string
}

/** Vertex AI Gemini — bills via GCP billing account (not AI Studio prepay wallet). */
export async function vertexGenerateContent(
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[],
  options: VertexGenerateOptions = {},
): Promise<string> {
  const accessToken = await auth.getAccessToken()
  const token =
    typeof accessToken === 'string'
      ? accessToken
      : (accessToken as { token?: string | null } | null | undefined)?.token
  if (!token) throw new Error('Vertex: no application default credentials')

  const model = options.model || visionModel()
  const url = `https://${region()}-aiplatform.googleapis.com/v1/projects/${projectId()}/locations/${region()}/publishers/google/models/${model}:generateContent`

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: options.json ? { responseMimeType: 'application/json' } : undefined,
  }
  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (!res.ok) {
    throw new Error(data.error?.message || `Vertex HTTP ${res.status}`)
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Vertex: empty response')
  return text
}

/** Multi-turn chat via Vertex (no tool calling — uses GCP billing). */
export async function vertexChat(
  messages: { role: string; content: string }[],
  systemInstruction: string,
): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const accessToken = await auth.getAccessToken()
  const token =
    typeof accessToken === 'string'
      ? accessToken
      : (accessToken as { token?: string | null } | null | undefined)?.token
  if (!token) throw new Error('Vertex: no application default credentials')

  const model = vertexTextModel()
  const url = `https://${region()}-aiplatform.googleapis.com/v1/projects/${projectId()}/locations/${region()}/publishers/google/models/${model}:generateContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    }),
  })

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (!res.ok) throw new Error(data.error?.message || `Vertex HTTP ${res.status}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Vertex: empty response')
  return text
}
