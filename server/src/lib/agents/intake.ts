import { ApiError, ErrorCodes } from '../errors'
import type { IntakeResult } from './types'
import { CIVIC_KEYWORDS, NON_CIVIC_KEYWORDS } from './types'

const MIN_IMAGE_BYTES = 1024

/** Agent 1 — IntakeAgent: validate media + is_civic_issue + SafeSearch */
export async function runIntakeAgent(
  imageBuffer: Buffer | undefined,
  hint?: string,
  title?: string,
  description?: string,
): Promise<IntakeResult> {
  if (imageBuffer && imageBuffer.length < MIN_IMAGE_BYTES) {
    throw new ApiError(ErrorCodes.INVALID_MEDIA, 'Image too small or blank')
  }

  const text = `${hint || ''} ${title || ''} ${description || ''}`.toLowerCase()

  const blocked = NON_CIVIC_KEYWORDS.find((kw) => text.includes(kw))
  if (blocked) {
    return {
      ok: false,
      isCivic: false,
      safeSearchPassed: false,
      reason: `Non-civic content detected (${blocked})`,
    }
  }

  const civicHint = CIVIC_KEYWORDS.some((kw) => text.includes(kw))
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

/** SafeSearch — keyword blocklist + optional Gemini text/vision check */
async function runSafeSearch(text: string, imageBuffer?: Buffer): Promise<boolean> {
  const unsafe = ['explicit', 'violence', 'weapon', 'drug', 'hate', 'nude', 'nsfw']
  if (unsafe.some((w) => text.includes(w))) return false

  if (process.env.GEMINI_API_KEY && imageBuffer && imageBuffer.length > 0) {
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
        'Is this image safe and appropriate for a civic infrastructure report? No explicit, violent, or non-civic content. Reply ONLY "yes" or "no".',
      ])
      const answer = result.response.text().trim().toLowerCase()
      if (answer.startsWith('no')) return false
      if (answer.startsWith('yes')) return true
    } catch {
      /* fall through */
    }
  }

  if (process.env.GEMINI_API_KEY && text.length > 20) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      const result = await model.generateContent(
        `Is this civic infrastructure report safe and appropriate? Reply ONLY "yes" or "no". Text: ${text.slice(0, 500)}`,
      )
      const answer = result.response.text().trim().toLowerCase()
      return answer.startsWith('yes')
    } catch {
      /* fall through to keyword pass */
    }
  }

  return true
}
