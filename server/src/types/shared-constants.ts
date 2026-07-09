/** Unified confidence gate — reports below this need review; points awarded at or above. */
export const CONFIDENCE_THRESHOLD = 0.7

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
