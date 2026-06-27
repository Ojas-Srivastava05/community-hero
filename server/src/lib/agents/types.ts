import type { IssueAnalysis } from '../../types/shared'

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
export const REVIEW_CONFIDENCE_THRESHOLD = 0.6

/** Confidence gate — Section 20.3: low confidence → Draft review queue */
export function confidenceGateUpdates(confidence: number): Record<string, unknown> {
  if (confidence < REVIEW_CONFIDENCE_THRESHOLD) {
    return { status: 'Draft', 'aiMetadata.needs_review': true }
  }
  return {}
}

export const NON_CIVIC_KEYWORDS = [
  'selfie',
  'portrait',
  'food',
  'restaurant',
  'pet',
  'dog',
  'cat',
  'meme',
  'screenshot',
  'dating',
  'nude',
  'porn',
  'gambling',
  'advertisement',
  'product',
  'shopping',
]

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
