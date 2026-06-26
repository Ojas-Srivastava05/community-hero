import ngeohash from 'ngeohash'
import { db } from './firebase-admin'
import { DEPARTMENTS, type IssueAnalysis } from '../types/shared'

/** Model G — severity*0.4 + upvotes*0.2 + safety*0.3 + age*0.1, normalized 0–100 */
export function computePriorityScore(
  severity: number,
  upvoteCount: number,
  safetyRisk: boolean,
  createdAt: string,
): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (24 * 3600000)
  const score =
    (severity / 5) * 40 +
    Math.min(upvoteCount / 20, 1) * 20 +
    (safetyRisk ? 30 : 0) +
    Math.min(ageDays / 14, 1) * 10
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10
}

export async function runAgentPipeline(
  issueId: string,
  analysis: IssueAnalysis,
  lat: number,
  lng: number,
  reporterId: string,
  wardId?: string,
) {
  const dept = DEPARTMENTS[analysis.category]
  const slaHours = dept.slaHours[Math.min(5, Math.max(1, analysis.severity))] || 72
  const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString()
  const now = new Date().toISOString()
  const priorityScore = computePriorityScore(analysis.severity, 0, analysis.safety_risk, now)

  const geohash = ngeohash.encode(lat, lng, 7)
  const dupes = await findDuplicates(lat, lng, analysis.category)

  const updates: Record<string, unknown> = {
    departmentId: analysis.department || dept.name,
    slaDeadline,
    priorityScore,
    geohash,
    wardId: wardId || `area-${geohash.slice(0, 5)}`,
    verificationLevel: 0,
    'aiMetadata.agents': ['intake', 'vision', 'routing', 'sla'],
    'aiMetadata.analysis': analysis,
    updatedAt: now,
  }

  if (analysis.confidence < 0.6) {
    updates.status = 'Draft'
    updates['aiMetadata.needs_review'] = true
  }

  if (dupes.length > 0) {
    updates['aiMetadata.duplicate_suggestions'] = dupes
  }

  await db.collection('issues').doc(issueId).update(updates)

  const events = [
    { type: 'ai_analysis', payload: analysis, actorId: 'vision-agent' },
    { type: 'routing', payload: { department: dept.name, slaDeadline, priorityScore }, actorId: 'routing-agent' },
  ]
  for (const ev of events) {
    await db.collection('issues').doc(issueId).collection('events').add({
      ...ev,
      timestamp: new Date().toISOString(),
    })
  }

  await awardPoints(reporterId, 10, 'report')
}

async function findDuplicates(lat: number, lng: number, category: string) {
  try {
    const center = ngeohash.encode(lat, lng, 6)
    const snap = await db
      .collection('issues')
      .where('geohash', '>=', center)
      .where('geohash', '<=', center + '\uf8ff')
      .limit(5)
      .get()
    return snap.docs
      .filter((d) => d.data().category === category)
      .map((d) => ({ id: d.id, title: d.data().title }))
  } catch {
    return []
  }
}

const BADGE_BY_REASON: Record<string, string> = {
  report: 'First Reporter',
  neighborhood_voice: 'Neighborhood Voice',
  merge: 'Duplicate Hunter',
  resolved: 'Verified Voice',
}

export async function awardPoints(uid: string, points: number, reason: string) {
  const ref = db.collection('users').doc(uid)
  const doc = await ref.get()
  const current = doc.data()?.civicPoints ?? 0
  const badges: string[] = [...(doc.data()?.badges ?? [])]
  const badge = BADGE_BY_REASON[reason]
  if (badge && !badges.includes(badge)) badges.push(badge)
  await ref.set(
    { civicPoints: current + points, badges, updatedAt: new Date().toISOString() },
    { merge: true },
  )
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
) {
  const now = new Date().toISOString()
  await db.collection('notifications').add({
    userId: reporterId,
    issueId,
    type: 'status_change',
    title: 'Issue status updated',
    body: `"${title}" is now ${status}`,
    read: false,
    createdAt: now,
  })
  await db.collection('issues').doc(issueId).collection('events').add({
    type: 'notify',
    actorId: 'notify-agent',
    payload: { status, reporterId },
    timestamp: now,
  })
}

export type UpvoteResult =
  | { ok: true; count: number; verificationLevel: number; already?: boolean }
  | { ok: false; forbidden: true }

export async function processUpvote(issueId: string, userId: string): Promise<UpvoteResult> {
  const allowed = await canUserUpvote(userId)
  if (!allowed) return { ok: false, forbidden: true }

  const issueRef = db.collection('issues').doc(issueId)
  const issue = await issueRef.get()
  const data = issue.data()!
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
  let status = data.status
  let verificationLevel = 0
  if (count >= 10) verificationLevel = 3
  else if (count >= 3) {
    verificationLevel = 2
    if (status === 'Submitted') status = 'Community Verified'
  } else if (count >= 1) verificationLevel = 1

  const safetyRisk = Boolean((data.aiMetadata as { analysis?: { safety_risk?: boolean } })?.analysis?.safety_risk) || (data.severity ?? 1) >= 4
  const priorityScore = computePriorityScore(data.severity ?? 1, count, safetyRisk, data.createdAt)

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
  if (reporterId && count === 3) await awardPoints(reporterId, 15, 'neighborhood_voice')
  await awardPoints(userId, 5, 'upvote')

  return { ok: true, count, verificationLevel }
}
