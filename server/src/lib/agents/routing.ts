import { DEPARTMENTS, type Category, type IssueAnalysis } from '../../types/shared'
import { computePriorityScore } from '../priority'
import type { RoutingResult } from './types'

/** Appendix L — full SLA matrix by category × severity (hours) */
export function getSlaHours(category: Category, severity: number): number {
  const dept = DEPARTMENTS[category] || DEPARTMENTS.other
  const sev = Math.min(5, Math.max(1, Math.round(severity)))
  return dept.slaHours[sev] || dept.slaHours[3] || 72
}

/** Agent 4 — RoutingAgent: department + SLA deadline + priority score */
export function runRoutingAgent(
  analysis: IssueAnalysis,
  createdAt: string,
  upvoteCount = 0,
): RoutingResult {
  const dept = DEPARTMENTS[analysis.category] || DEPARTMENTS.other
  const slaHours = getSlaHours(analysis.category, analysis.severity)
  const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString()
  const priorityScore = computePriorityScore(
    analysis.severity,
    upvoteCount,
    analysis.safety_risk,
    createdAt,
  )

  return {
    departmentId: analysis.department || dept.name,
    slaDeadline,
    slaHours,
    priorityScore,
  }
}
