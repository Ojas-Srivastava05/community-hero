import { ApiError, ErrorCodes } from '../errors'
import { CATEGORIES } from '../../types/shared'
import { isVertexPreferred, liteModel, vertexGenerateContent } from '../vertex-gemini'
import type { IntakeResult } from './types'
import {
  CIVIC_KEYWORDS,
  HARD_NON_CIVIC_KEYWORDS,
  SOFT_NON_CIVIC_KEYWORDS,
} from './types'

const MIN_IMAGE_BYTES = 1024

function hasCivicContext(text: string, category?: string): boolean {
  if (category && (CATEGORIES as readonly string[]).includes(category) && category !== 'other') {
    return true
  }
  return CIVIC_KEYWORDS.some((kw) => text.includes(kw))
}

function findBlockedKeyword(text: string, category?: string): string | undefined {
  const hard = HARD_NON_CIVIC_KEYWORDS.find((kw) => text.includes(kw))
  if (hard) return hard
  if (hasCivicContext(text, category)) return undefined
  return SOFT_NON_CIVIC_KEYWORDS.find((kw) => text.includes(kw))
}

/** Agent 1 — IntakeAgent: validate media + is_civic_issue + SafeSearch */
export async function runIntakeAgent(
  imageBuffer: Buffer | undefined,
  hint?: string,
  title?: string,
  description?: string,
  category?: string,
): Promise<IntakeResult> {
  if (imageBuffer && imageBuffer.length < MIN_IMAGE_BYTES) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Image too small or blank')
  }

  const text = `${hint || ''} ${title || ''} ${description || ''}`.toLowerCase()

  const blocked = findBlockedKeyword(text, category)
  if (blocked) {
    return {
      ok: false,
      isCivic: false,
      safeSearchPassed: false,
      reason: `Non-civic content detected (${blocked})`,
    }
  }

  const civicHint = hasCivicContext(text, category)
  const safeSearchPassed = await runSafeSearch(text, imageBuffer)
  const isCivic = civicHint || safeSearchPassed

  if (!isCivic && !imageBuffer) {
    return {
      ok: false,
      isCivic: false,
      safeSearchPassed,
      reason: 'No civic indicators in report text',
    }
  }

  return { ok: true, isCivic: isCivic || Boolean(imageBuffer), safeSearchPassed }
}

/** SafeSearch — keyword blocklist + optional Vertex/Gemini vision check */
async function runSafeSearch(text: string, imageBuffer?: Buffer): Promise<boolean> {
  const unsafe = ['explicit', 'violence', 'weapon', 'drug', 'hate', 'nude', 'nsfw']
  if (unsafe.some((w) => text.includes(w))) return false

  const safetyPrompt =
    'Is this image safe and appropriate for a civic infrastructure report? No explicit, violent, or non-civic content. Reply ONLY "yes" or "no".'

  if (imageBuffer && imageBuffer.length > 0) {
    if (isVertexPreferred()) {
      try {
        const answer = await vertexGenerateContent(
          [
            { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
            { text: safetyPrompt },
          ],
          { model: liteModel() },
        )
        const norm = answer.trim().toLowerCase()
        if (norm.startsWith('no')) return false
        if (norm.startsWith('yes')) return true
      } catch {
        /* fall through */
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBuffer.toString('base64'),
            },
          },
          safetyPrompt,
        ])
        const answer = result.response.text().trim().toLowerCase()
        if (answer.startsWith('no')) return false
        if (answer.startsWith('yes')) return true
      } catch {
        /* fall through */
      }
    }
  }

  if (text.length > 20) {
    const textPrompt = `Is this civic infrastructure report safe and appropriate? Reply ONLY "yes" or "no". Text: ${text.slice(0, 500)}`
    if (isVertexPreferred()) {
      try {
        const answer = await vertexGenerateContent([{ text: textPrompt }], { model: liteModel() })
        return answer.trim().toLowerCase().startsWith('yes')
      } catch {
        /* fall through */
      }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
        const result = await model.generateContent(textPrompt)
        return result.response.text().trim().toLowerCase().startsWith('yes')
      } catch {
        /* fall through to keyword pass */
      }
    }
  }

  return true
}
