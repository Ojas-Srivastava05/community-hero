import { db } from '../firebase-admin'
import { computePriorityScore } from '../priority'

const ESCALATION_BOOST = 25
const TERMINAL_STATUSES = ['Resolved', 'Closed']

export function computeSlaBreached(
  slaDeadline: string | undefined,
  status: string | undefined,
): boolean {
  if (!slaDeadline || TERMINAL_STATUSES.includes(status || '')) return false
  return Date.now() > new Date(slaDeadline).getTime()
}

/** Detect SLA breach and escalate priorityScore +25 once */
export async function checkAndApplySlaBreach(
  issueId: string,
  data: Record<string, unknown>,
): Promise<{ slaBreached: boolean; priorityScore: number }> {
  const slaDeadline = data.slaDeadline as string | undefined
  const status = data.status as string | undefined
  const breached = computeSlaBreached(slaDeadline, status)
  let priorityScore = (data.priorityScore as number) ?? 0
  const alreadyEscalated = Boolean((data.aiMetadata as { slaEscalated?: boolean })?.slaEscalated)

  if (breached && !alreadyEscalated) {
    priorityScore = Math.min(100, priorityScore + ESCALATION_BOOST)
    const safetyRisk = Boolean(
      (data.aiMetadata as { analysis?: { safety_risk?: boolean } })?.analysis?.safety_risk,
    )
    priorityScore = Math.min(
      100,
      computePriorityScore(
        (data.severity as number) ?? 1,
        (data.upvoteCount as number) ?? 0,
        safetyRisk,
        (data.createdAt as string) ?? new Date().toISOString(),
      ) + ESCALATION_BOOST,
    )

    await db.collection('issues').doc(issueId).update({
      slaBreached: true,
      priorityScore,
      'aiMetadata.slaEscalated': true,
      updatedAt: new Date().toISOString(),
    })

    await db.collection('issues').doc(issueId).collection('events').add({
      type: 'sla_breach',
      actorId: 'routing-agent',
      payload: { priorityScore, slaDeadline },
      timestamp: new Date().toISOString(),
    })
  } else if (breached !== Boolean(data.slaBreached)) {
    await db.collection('issues').doc(issueId).update({
      slaBreached: breached,
      updatedAt: new Date().toISOString(),
    })
  }

  return { slaBreached: breached, priorityScore }
}

export async function enrichIssuesWithSla<T extends { id: string; [key: string]: unknown }>(
  issues: T[],
): Promise<T[]> {
  const enriched: T[] = []
  for (const issue of issues) {
    const breached = computeSlaBreached(
      issue.slaDeadline as string | undefined,
      issue.status as string | undefined,
    )
    let priorityScore = (issue.priorityScore as number) ?? 0

    if (breached && !issue.slaBreached) {
      const result = await checkAndApplySlaBreach(issue.id, issue)
      enriched.push({ ...issue, slaBreached: result.slaBreached, priorityScore: result.priorityScore })
    } else {
      enriched.push({ ...issue, slaBreached: breached, priorityScore })
    }
  }
  return enriched
}
