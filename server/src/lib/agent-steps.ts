import type { AgentStep } from '../types/shared-constants'
import type { AgentEvent } from './agents/types'

const LABELS: Record<string, string> = {
  intake: 'Intake Agent',
  ai_analysis: 'Vision Agent',
  dedup: 'Dedup Agent',
  routing: 'Routing Agent',
  status_narrative: 'Communicator Agent',
  insights: 'Insights Agent',
}

function detailForEvent(ev: AgentEvent): string {
  const p = ev.payload
  switch (ev.type) {
    case 'intake':
      return p.ok ? 'Civic image verified' : String(p.reason || 'Needs review')
    case 'ai_analysis':
      return `${String(p.category || 'issue')} · severity ${p.severity ?? '?'} · ${Math.round(Number(p.confidence ?? 0) * 100)}% confidence`
    case 'dedup':
      return Number(p.duplicateCount) > 0
        ? `${p.duplicateCount} similar report(s) nearby`
        : 'No duplicates found'
    case 'routing':
      return `${String(p.department || 'Department')} · SLA ${p.slaHours ?? '?'}h`
    case 'status_narrative':
      return 'Citizen advisory drafted (EN + HI)'
    default:
      return ev.type.replace(/_/g, ' ')
  }
}

export function eventsToAgentSteps(events: AgentEvent[]): AgentStep[] {
  const steps: AgentStep[] = events.map((ev) => ({
    id: ev.type === 'ai_analysis' ? 'vision' : ev.type === 'status_narrative' ? 'communicator' : ev.type,
    label: LABELS[ev.type] || ev.type,
    status: 'done' as const,
    detail: detailForEvent(ev),
  }))
  steps.push({
    id: 'insights',
    label: LABELS.insights,
    status: 'done',
    detail: 'Hotspot batch scheduled',
  })
  return steps
}

export function intakeVisionSteps(intakeOk: boolean, intakeReason?: string, analysis?: {
  category?: string
  severity?: number
  confidence?: number
}): AgentStep[] {
  return [
    {
      id: 'intake',
      label: LABELS.intake,
      status: intakeOk ? 'done' : 'error',
      detail: intakeOk ? 'Civic image verified' : intakeReason || 'Failed civic check',
    },
    {
      id: 'vision',
      label: LABELS.ai_analysis,
      status: analysis ? 'done' : 'pending',
      detail: analysis
        ? `${analysis.category} · severity ${analysis.severity} · ${Math.round((analysis.confidence ?? 0) * 100)}%`
        : undefined,
    },
  ]
}
