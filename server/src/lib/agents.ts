import ngeohash from 'ngeohash'
import { db } from './firebase-admin'
import { DEPARTMENTS, type IssueAnalysis } from '../types/shared'

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
  const priorityScore =
    analysis.severity * 0.4 * 20 +
    (analysis.safety_risk ? 30 : 0) +
    analysis.confidence * 10

  const geohash = ngeohash.encode(lat, lng, 7)
  const dupes = await findDuplicates(lat, lng, analysis.category)

  const updates: Record<string, unknown> = {
    departmentId: dept.name,
    slaDeadline,
    priorityScore,
    geohash,
    wardId: wardId || `area-${geohash.slice(0, 5)}`,
    verificationLevel: 0,
    'aiMetadata.agents': ['intake', 'vision', 'routing', 'sla'],
    updatedAt: new Date().toISOString(),
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
    { type: 'routing', payload: { department: dept.name, slaDeadline }, actorId: 'routing-agent' },
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

export async function awardPoints(uid: string, points: number, reason: string) {
  const ref = db.collection('users').doc(uid)
  const doc = await ref.get()
  const current = doc.data()?.civicPoints ?? 0
  const badges: string[] = doc.data()?.badges ?? []
  if (reason === 'report' && !badges.includes('First Reporter')) badges.push('First Reporter')
  await ref.set(
    { civicPoints: current + points, badges, updatedAt: new Date().toISOString() },
    { merge: true },
  )
}

export async function processUpvote(issueId: string, userId: string) {
  const voteRef = db.collection('issues').doc(issueId).collection('votes').doc(userId)
  const existing = await voteRef.get()
  if (existing.exists) return { already: true }

  await voteRef.set({ createdAt: new Date().toISOString() })
  const issueRef = db.collection('issues').doc(issueId)
  const issue = await issueRef.get()
  const count = (issue.data()?.upvoteCount ?? 0) + 1
  let status = issue.data()?.status
  let verificationLevel = 0
  if (count >= 10) verificationLevel = 3
  else if (count >= 3) {
    verificationLevel = 2
    if (status === 'Submitted') status = 'Community Verified'
  } else if (count >= 1) verificationLevel = 1

  await issueRef.update({ upvoteCount: count, verificationLevel, status, updatedAt: new Date().toISOString() })
  await issueRef.collection('events').add({
    type: 'upvote',
    actorId: userId,
    payload: { count },
    timestamp: new Date().toISOString(),
  })

  const reporterId = issue.data()?.reporterId
  if (reporterId && count === 3) await awardPoints(reporterId, 15, 'verified')
  await awardPoints(userId, 5, 'upvote')

  return { count, verificationLevel }
}
