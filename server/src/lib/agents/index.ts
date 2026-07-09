import { db } from '../firebase-admin'
import type { IssueAnalysis } from '../../types/shared'
import { runIntakeAgent } from './intake'
import { runVisionAgent } from './vision'
import { runDedupAgent } from './dedup'
import { runRoutingAgent } from './routing'
import { runCitizenCommunicator } from './communicator'
import { runInsightsForIssue } from './insights'
import { issueEmbeddingText } from '../embeddings'
import { REVIEW_CONFIDENCE_THRESHOLD, confidenceGateUpdates, type AgentEvent } from './types'
import {
  awardPoints,
  shouldAwardReportPoints,
  POINTS,
  type AwardResult,
} from '../gamification'
import { eventsToAgentSteps } from '../agent-steps'
import type { AgentStep } from '../../types/shared-constants'

export { confidenceGateUpdates, REVIEW_CONFIDENCE_THRESHOLD } from './types'
export { awardPoints, currentWeekKey, type AwardResult } from '../gamification'

export { computePriorityScore } from '../priority'
export { runInsightsBatch, runInsightsForIssue } from './insights'
export { computeSlaBreached, checkAndApplySlaBreach, enrichIssuesWithSla } from './sla'
export { getSlaHours } from './routing'
export { runCitizenCommunicator } from './communicator'

export type RunPipelineInput = {
  issueId: string
  analysis?: IssueAnalysis
  lat: number
  lng: number
  reporterId: string
  wardId?: string
  title?: string
  description?: string
  imageBuffer?: Buffer
  imageMime?: string
  createdAt?: string
  precomputedEmbedding?: number[]
  /** Fired after each agent completes — used for NDJSON streaming demos. */
  onEvent?: (ev: AgentEvent, step: AgentStep) => void
}

function emitStep(
  onEvent: RunPipelineInput['onEvent'],
  ev: AgentEvent,
) {
  if (!onEvent) return
  const steps = eventsToAgentSteps([ev]).filter((s) => s.id !== 'insights' || ev.type === 'insights')
  const step = steps[0] || {
    id: ev.type,
    label: ev.type,
    status: 'done' as const,
    detail: undefined,
  }
  onEvent(ev, step)
}

/** Orchestrator — runs all 6 agents after report create */
export async function runAgentPipeline(input: RunPipelineInput) {
  const {
    issueId,
    lat,
    lng,
    reporterId,
    wardId,
    title = '',
    description = '',
    analysis: visionAnalysis,
    imageBuffer,
    imageMime,
    createdAt = new Date().toISOString(),
    onEvent,
  } = input

  const agentsRun: string[] = []
  const events: AgentEvent[] = []
  const now = new Date().toISOString()

  // Agent 1: Intake
  const intake = await runIntakeAgent(imageBuffer, description, title, description, visionAnalysis?.category)
  agentsRun.push('intake')
  const intakeEv: AgentEvent = {
    type: 'intake',
    actorId: 'intake-agent',
    payload: {
      isCivic: intake.isCivic,
      safeSearchPassed: intake.safeSearchPassed,
      ok: intake.ok,
      reason: intake.reason,
    },
    timestamp: now,
  }
  events.push(intakeEv)
  emitStep(onEvent, intakeEv)

  if (!intake.ok || !intake.isCivic) {
    await db.collection('issues').doc(issueId).update({
      status: 'Draft',
      'aiMetadata.data_source': 'ai',
      'aiMetadata.needs_review': true,
      'aiMetadata.intake_rejected': intake.reason,
      'aiMetadata.agents': agentsRun,
      updatedAt: now,
    })
    for (const ev of events) {
      await db.collection('issues').doc(issueId).collection('events').add(ev)
    }
    return { needsReview: true, agents: agentsRun, agentSteps: eventsToAgentSteps(events) }
  }

  // Agent 2: Vision
  const vision = await runVisionAgent(imageBuffer, imageMime, description, input.analysis)
  const analysis = vision.analysis
  agentsRun.push('vision')
  const visionEv: AgentEvent = {
    type: 'ai_analysis',
    actorId: 'vision-agent',
    payload: analysis as unknown as Record<string, unknown>,
    timestamp: now,
  }
  events.push(visionEv)
  emitStep(onEvent, visionEv)

  // Agent 3: Dedup
  const embedText = issueEmbeddingText(
    analysis.title,
    analysis.description,
    analysis.category,
  )
  const dedup = await runDedupAgent(lat, lng, analysis.category, embedText, input.precomputedEmbedding, issueId)
  agentsRun.push('dedup')
  const dedupEv: AgentEvent = {
    type: 'dedup',
    actorId: 'dedup-agent',
    payload: {
      geohash: dedup.geohash,
      duplicateCount: dedup.duplicates.length,
      duplicates: dedup.duplicates,
    },
    timestamp: now,
  }
  events.push(dedupEv)
  emitStep(onEvent, dedupEv)

  // Agent 4: Routing
  const routing = runRoutingAgent(analysis, createdAt)
  agentsRun.push('routing')
  const routingEv: AgentEvent = {
    type: 'routing',
    actorId: 'routing-agent',
    payload: {
      department: routing.departmentId,
      slaDeadline: routing.slaDeadline,
      slaHours: routing.slaHours,
      priorityScore: routing.priorityScore,
    },
    timestamp: now,
  }
  events.push(routingEv)
  emitStep(onEvent, routingEv)

  // Agent 5: Communicator
  const comm = await runCitizenCommunicator('Submitted', analysis.title, routing.departmentId)
  agentsRun.push('communicator')
  const commEv: AgentEvent = {
    type: 'status_narrative',
    actorId: 'communicator-agent',
    payload: { en: comm.narrativeEn, hi: comm.narrativeHi, status: 'Submitted' },
    timestamp: now,
  }
  events.push(commEv)
  emitStep(onEvent, commEv)

  // Agent 6: real-time insights for this report
  agentsRun.push('insights')
  let insightDetail = 'Analyzing ward patterns…'
  let insightMeta: Record<string, unknown> | undefined
  try {
    const insight = await runInsightsForIssue({
      id: issueId,
      category: analysis.category,
      wardId: wardId || `area-${dedup.geohash.slice(0, 5)}`,
      geohash: dedup.geohash,
      lat: input.lat,
      lng: input.lng,
    })
    insightDetail = insight.narrative
    insightMeta = insight
  } catch {
    insightDetail = 'Ward insight queued for batch refresh'
  }
  const insightsEv: AgentEvent = {
    type: 'insights',
    actorId: 'insights-agent',
    payload: { narrative: insightDetail, realtime: true },
    timestamp: now,
  }
  events.push(insightsEv)
  onEvent?.(insightsEv, {
    id: 'insights',
    label: 'Insights Agent',
    status: 'done',
    detail: insightDetail,
  })

  const needsReview = analysis.confidence < REVIEW_CONFIDENCE_THRESHOLD

  const updates: Record<string, unknown> = {
    departmentId: routing.departmentId,
    slaDeadline: routing.slaDeadline,
    priorityScore: routing.priorityScore,
    geohash: dedup.geohash,
    embedding: dedup.embedding,
    wardId: wardId || `area-${dedup.geohash.slice(0, 5)}`,
    verificationLevel: 0,
    slaBreached: false,
    'aiMetadata.data_source': 'ai',
    'aiMetadata.agents': agentsRun,
    'aiMetadata.analysis': analysis,
    'aiMetadata.embedding': dedup.embedding,
    'aiMetadata.statusNarrative': { en: comm.narrativeEn, hi: comm.narrativeHi },
    updatedAt: now,
    ...confidenceGateUpdates(analysis.confidence),
  }

  if (dedup.duplicates.length > 0) {
    updates['aiMetadata.duplicate_suggestions'] = dedup.duplicates
  }
  if (insightMeta) {
    updates['aiMetadata.insight'] = insightMeta
  }

  await db.collection('issues').doc(issueId).update(updates)

  for (const ev of events) {
    if (ev.type === 'insights') continue
    await db.collection('issues').doc(issueId).collection('events').add(ev)
  }

  let pointsEarned: AwardResult = { pointsAwarded: 0, badgesEarned: [] }
  if (shouldAwardReportPoints(analysis.confidence)) {
    pointsEarned = await awardPoints(reporterId, POINTS.report, 'report', {
      wardId: wardId || `area-${dedup.geohash.slice(0, 5)}`,
    })
  }

  return {
    needsReview,
    agents: agentsRun,
    analysis,
    routing,
    pointsEarned,
    agentSteps: eventsToAgentSteps(events.filter((e) => e.type !== 'insights')),
  }
}

export async function canUserUpvote(userId: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get()
  const createdAt = userDoc.data()?.createdAt as string | undefined
  if (createdAt) {
    const ageMs = Date.now() - new Date(createdAt).getTime()
    if (ageMs > 24 * 3600000) return true
  }
  const priorReports = await db.collection('issues').where('reporterId', '==', userId).limit(1).get()
  return !priorReports.empty
}

export async function notifyStatusChange(
  issueId: string,
  reporterId: string,
  status: string,
  title: string,
  narrative?: { en: string; hi: string },
) {
  const now = new Date().toISOString()
  const body = narrative?.en || `"${title}" is now ${status}`

  await db.collection('notifications').add({
    userId: reporterId,
    issueId,
    type: 'status_change',
    title: 'Issue status updated',
    body,
    bodyHi: narrative?.hi,
    read: false,
    createdAt: now,
  })

  await db.collection('issues').doc(issueId).collection('events').add({
    type: 'notify',
    actorId: 'communicator-agent',
    payload: { status, reporterId, narrative },
    timestamp: now,
  })
}

/** Pure tier logic — 1 = Acknowledged, 2 = Community Verified, 3 = Priority Escalation */
export function computeVerificationFromUpvotes(
  count: number,
  currentStatus?: string,
): { verificationLevel: number; status: string | undefined } {
  let verificationLevel = 0
  let status: string | undefined = currentStatus
  if (count >= 10) verificationLevel = 3
  else if (count >= 3) {
    verificationLevel = 2
    if (currentStatus === 'Submitted') status = 'Community Verified'
  } else if (count >= 1) verificationLevel = 1
  return { verificationLevel, status }
}

export type UpvoteResult =
  | { ok: true; count: number; verificationLevel: number; already?: boolean; pointsAwarded?: number; badgesEarned?: string[] }
  | { ok: false; forbidden: true }
  | { ok: false; notFound: true }

export async function processUpvote(issueId: string, userId: string): Promise<UpvoteResult> {
  const allowed = await canUserUpvote(userId)
  if (!allowed) return { ok: false, forbidden: true }

  const issueRef = db.collection('issues').doc(issueId)
  const issue = await issueRef.get()
  if (!issue.exists) return { ok: false, notFound: true }

  const data = issue.data()!
  if (data.reporterId === userId) return { ok: false, forbidden: true }
  const voteRef = issueRef.collection('votes').doc(userId)
  const existing = await voteRef.get()
  if (existing.exists) {
    return {
      ok: true,
      already: true,
      count: data.upvoteCount ?? 0,
      verificationLevel: data.verificationLevel ?? 0,
    }
  }

  await voteRef.set({ createdAt: new Date().toISOString() })
  const count = (data.upvoteCount ?? 0) + 1
  const { verificationLevel, status } = computeVerificationFromUpvotes(count, data.status)

  const { computePriorityScore: calcPriority } = await import('../priority')
  const safetyRisk =
    Boolean((data.aiMetadata as { analysis?: { safety_risk?: boolean } })?.analysis?.safety_risk) ||
    (data.severity ?? 1) >= 4
  const priorityScore = calcPriority(data.severity ?? 1, count, safetyRisk, data.createdAt)

  await issueRef.update({
    upvoteCount: count,
    verificationLevel,
    status,
    priorityScore,
    updatedAt: new Date().toISOString(),
  })
  await issueRef.collection('events').add({
    type: 'upvote',
    actorId: userId,
    payload: { count },
    timestamp: new Date().toISOString(),
  })

  const reporterId = data.reporterId as string | undefined
  if (reporterId && count === 3) await awardPoints(reporterId, POINTS.neighborhood_voice, 'neighborhood_voice')
  const voterAward = await awardPoints(userId, POINTS.upvote, 'upvote')

  return {
    ok: true,
    count,
    verificationLevel,
    pointsAwarded: voterAward.pointsAwarded,
    badgesEarned: voterAward.badgesEarned,
  }
}

/** Back-compat wrapper for old call signature */
export async function runAgentPipelineLegacy(
  issueId: string,
  analysis: IssueAnalysis,
  lat: number,
  lng: number,
  reporterId: string,
  wardId?: string,
  precomputedEmbedding?: number[],
) {
  return runAgentPipeline({ issueId, analysis, lat, lng, reporterId, wardId, precomputedEmbedding })
}
