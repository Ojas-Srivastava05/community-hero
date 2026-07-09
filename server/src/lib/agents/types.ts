import type { IssueAnalysis } from '../../types/shared'
import { CONFIDENCE_THRESHOLD } from '../../types/shared-constants'

export type AgentName =
  | 'intake'
  | 'vision'
  | 'dedup'
  | 'routing'
  | 'communicator'
  | 'insights'

export type AgentEvent = {
  type: string
  actorId: string
  payload: Record<string, unknown>
  timestamp: string
}

export type IntakeResult = {
  ok: boolean
  isCivic: boolean
  safeSearchPassed: boolean
  reason?: string
}

export type VisionResult = {
  analysis: IssueAnalysis
}

export type DedupResult = {
  geohash: string
  embedding: number[]
  duplicates: { id: string; title: string; similarity: number; distanceM: number }[]
}

export type RoutingResult = {
  departmentId: string
  slaDeadline: string
  slaHours: number
  priorityScore: number
}

export type CommunicatorResult = {
  narrativeEn: string
  narrativeHi: string
}

/** Section 20.3 — low confidence → Draft review queue */
export const REVIEW_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD

/** Confidence gate — Section 20.3: low confidence → Draft review queue */
export function confidenceGateUpdates(confidence: number): Record<string, unknown> {
  if (confidence < REVIEW_CONFIDENCE_THRESHOLD) {
    return { status: 'Draft', 'aiMetadata.needs_review': true }
  }
  return {}
}

export const HARD_NON_CIVIC_KEYWORDS = [
  'nude',
  'porn',
  'gambling',
]

/** Only block when no civic context — e.g. "food" appears in "food containers" in waste dumps */
export const SOFT_NON_CIVIC_KEYWORDS = [
  'selfie',
  'portrait',
  'restaurant menu',
  'pet photo',
  'dog photo',
  'cat photo',
  'meme',
  'screenshot',
  'dating',
  'advertisement',
  'product review',
  'shopping haul',
]

/** @deprecated use HARD + SOFT lists */
export const NON_CIVIC_KEYWORDS = [...HARD_NON_CIVIC_KEYWORDS, ...SOFT_NON_CIVIC_KEYWORDS]

export const CIVIC_KEYWORDS = [
  'pothole',
  'road',
  'water',
  'leak',
  'drain',
  'garbage',
  'waste',
  'streetlight',
  'light',
  'sign',
  'encroach',
  'damage',
  'broken',
  'flooding',
  'sewage',
  'trash',
  'civic',
  'bbmp',
]
