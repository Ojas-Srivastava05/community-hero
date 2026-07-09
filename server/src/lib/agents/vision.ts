import { analyzeImage } from '../gemini'
import type { IssueAnalysis } from '../../types/shared'
import type { VisionResult } from './types'

/** Agent 2 — VisionAgent: wire analyzeImage result */
export async function runVisionAgent(
  imageBuffer: Buffer | undefined,
  mimeType: string | undefined,
  hint?: string,
  existing?: IssueAnalysis,
): Promise<VisionResult> {
  if (existing && existing.confidence > 0) {
    return { analysis: existing }
  }

  if (!imageBuffer || !mimeType) {
    return {
      analysis: existing || {
        category: 'other',
        severity: 3,
        title: hint || 'Civic issue reported',
        description: hint || 'Report submitted without image analysis.',
        department: 'General Civic',
        safety_risk: false,
        confidence: 0.5,
      },
    }
  }

  const { analysis } = await analyzeImage(imageBuffer, mimeType, hint)
  return { analysis }
}
