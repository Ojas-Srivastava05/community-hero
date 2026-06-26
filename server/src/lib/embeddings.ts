import { GoogleGenerativeAI } from '@google/generative-ai'

const EMBEDDING_MODEL = 'text-embedding-004'
export const SIMILARITY_THRESHOLD = 0.85
export const MAX_DISTANCE_KM = 0.05 // 50 meters

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export type DuplicateCandidate = {
  id: string
  title: string
  similarity: number
  distanceM: number
}

/** Build canonical text for embedding from issue fields. */
export function issueEmbeddingText(title: string, description: string, category: string): string {
  return [category, title, description].filter(Boolean).join(' | ')
}

/** Cosine similarity between two equal-length vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

/** Simple bag-of-words fallback when Gemini embedding API is unavailable */
function fallbackEmbedding(text: string, dims = 64): number[] {
  const vec = new Array<number>(dims).fill(0)
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  for (const token of tokens) {
    let h = 0
    for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0
    vec[h % dims]! += 1
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}

/** Generate embedding via text-embedding-004 or deterministic fallback */
export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.trim().slice(0, 2000)
  if (!input) return fallbackEmbedding('empty')

  if (!genAI) return fallbackEmbedding(input)

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
    const result = await model.embedContent(input)
    const values = result.embedding?.values
    if (values?.length) return values
  } catch (e) {
    console.warn('Embedding API failed, using fallback vector:', e)
  }

  return fallbackEmbedding(input)
}

export function isDuplicateMatch(similarity: number, distanceKm: number): boolean {
  return similarity > SIMILARITY_THRESHOLD && distanceKm <= MAX_DISTANCE_KM
}
