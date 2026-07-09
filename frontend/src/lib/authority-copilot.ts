import type { Issue } from '../../../shared/types'
import { categoryLabel } from './issue-ui'

/** Rough INR cost-of-inaction estimates for demo / authority co-pilot. */
const BASE_INR: Record<string, number> = {
  pothole: 18_000,
  road_damage: 45_000,
  water_leak: 32_000,
  drainage: 28_000,
  streetlight: 8_000,
  waste: 14_000,
  signage: 5_000,
  encroachment: 15_000,
  other: 10_000,
}

export type CostOfInaction = {
  dailyInr: number
  weeklyInr: number
  label: string
  drivers: string[]
  /** Transparent formula for demos / Q&A */
  formula: string
}

export function estimateCostOfInaction(issue: Issue): CostOfInaction {
  const base = BASE_INR[issue.category] ?? 10_000
  const severityMul = 0.6 + issue.severity * 0.28
  const boostMul = 1 + Math.min(issue.upvoteCount, 20) * 0.04
  const breachMul = issue.slaBreached ? 1.45 : 1
  const dailyInr = Math.round(base * severityMul * boostMul * breachMul)
  const weeklyInr = dailyInr * 7
  const formula = `₹${base.toLocaleString('en-IN')} (${issue.category} base) × ${severityMul.toFixed(2)} (severity ${issue.severity}/5) × ${boostMul.toFixed(2)} (community boosts) × ${breachMul.toFixed(2)} (SLA)`
  const drivers = [
    `${categoryLabel(issue.category)} baseline repair risk`,
    `Severity ${issue.severity}/5 multiplier`,
  ]
  if (issue.upvoteCount >= 3) drivers.push('Community-verified demand signal')
  if (issue.slaBreached) drivers.push('SLA breach escalation premium')
  if (issue.aiMetadata?.safety_risk === true || issue.aiMetadata?.safetyRisk === true) {
    drivers.push('Safety-risk flag from Vision agent')
  }
  return {
    dailyInr,
    weeklyInr,
    label: `Est. ₹${dailyInr.toLocaleString('en-IN')}/day if unresolved`,
    drivers,
    formula,
  }
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

export type DispatchPlan = {
  crew: string
  windowHours: number
  materials: string[]
  checklist: string[]
  priorityBand: 'P1' | 'P2' | 'P3'
}

export function buildDispatchPlan(issue: Issue): DispatchPlan {
  const slaLeft = issue.slaDeadline
    ? Math.max(1, Math.round((new Date(issue.slaDeadline).getTime() - Date.now()) / 3_600_000))
    : 48
  const priorityBand: DispatchPlan['priorityBand'] =
    issue.severity >= 4 || issue.slaBreached ? 'P1' : issue.severity >= 3 ? 'P2' : 'P3'
  const byCat: Record<string, { crew: string; materials: string[] }> = {
    pothole: { crew: 'Roads patch crew (2–3)', materials: ['Cold mix / hot mix', 'Compactor', 'Traffic cones'] },
    road_damage: { crew: 'Roads structural crew', materials: ['Asphalt', 'Barricades', 'Survey kit'] },
    water_leak: { crew: 'Water Board field team', materials: ['Pipe clamps', 'Valves', 'Pump'] },
    drainage: { crew: 'Stormwater desilt unit', materials: ['Desilter', 'PPE', 'Cover slabs'] },
    streetlight: { crew: 'Electrical maintenance', materials: ['LED fixture', 'Ladder truck', 'Fuse kit'] },
    waste: { crew: 'Sanitation sweep unit', materials: ['Loader', 'Bins', 'Disinfectant'] },
    signage: { crew: 'Traffic signage unit', materials: ['Sign board', 'Poles', 'Reflective tape'] },
    encroachment: { crew: 'Enforcement squad', materials: ['Notice forms', 'Photo log', 'Tow support'] },
    other: { crew: 'General civic squad', materials: ['Inspection kit', 'PPE'] },
  }
  const pack = byCat[issue.category] || byCat.other
  return {
    crew: pack.crew,
    windowHours: Math.min(slaLeft, priorityBand === 'P1' ? 24 : priorityBand === 'P2' ? 48 : 72),
    materials: pack.materials,
    checklist: [
      'Confirm GPS pin + photo match on site',
      'Notify nearby residents if lane closure needed',
      'Capture after-photo for AI resolution verify',
      'Update status to In Progress → Resolved',
    ],
    priorityBand,
  }
}
