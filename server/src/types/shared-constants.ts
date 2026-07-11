/** Keep in sync with `shared/constants.ts` (server tsc rootDir cannot import outside `server/`). */

/** Unified confidence gate — reports below this need review; points awarded at or above. */
export const CONFIDENCE_THRESHOLD = 0.7

/** Client-side pick limits before resize / keyframe extraction. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
/** Server multer cap for uploaded image buffers (matches client image limit). */
export const MAX_UPLOAD_BYTES = MAX_IMAGE_BYTES

export const MAX_IMAGE_MB = 50
export const MAX_VIDEO_MB = 50

export type ProofComparison = {
  improved: boolean
  summary: string
  confidence: number
}

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export type AgentStep = {
  id: string
  label: string
  status: AgentStepStatus
  detail?: string
  ms?: number
}
