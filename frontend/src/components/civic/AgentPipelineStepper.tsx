import { Check, Loader2, Sparkles } from 'lucide-react'
import type { AgentStep } from '@/lib/shared-constants'
import { cn } from '@/lib/utils'

const ORDER = ['intake', 'vision', 'dedup', 'routing', 'communicator', 'insights']

type AgentPipelineStepperProps = {
  steps: AgentStep[]
  running?: boolean
  className?: string
}

export function AgentPipelineStepper({ steps, running, className }: AgentPipelineStepperProps) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const ordered = ORDER.map((id) => byId.get(id)).filter(Boolean) as AgentStep[]

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-coral" />
        <p className="text-xs font-bold uppercase tracking-wider text-coral">AI agent pipeline</p>
      </div>
      <ol className="space-y-2">
        {ordered.map((step) => (
          <li
            key={step.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
              step.status === 'done' && 'border-leaf/30 bg-leaf-soft/30',
              step.status === 'running' && 'border-coral/40 bg-coral-soft/40',
              step.status === 'error' && 'border-sev-critical/30 bg-sev-critical/10',
              step.status === 'pending' && 'border-rule bg-surface/50 opacity-60',
            )}
          >
            <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-rule bg-paper">
              {step.status === 'running' ? (
                <Loader2 className="size-3.5 animate-spin text-coral" />
              ) : step.status === 'done' ? (
                <Check className="size-3.5 text-leaf" />
              ) : (
                <span className="text-[10px] font-bold text-ink-muted">{ORDER.indexOf(step.id) + 1}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{step.label}</p>
              {step.detail && <p className="mt-0.5 text-[11px] text-ink-muted">{step.detail}</p>}
            </div>
          </li>
        ))}
        {running && ordered.every((s) => s.status !== 'running') && (
          <li className="flex items-center gap-2 px-3 text-[11px] text-ink-muted">
            <Loader2 className="size-3.5 animate-spin text-coral" /> Orchestrating agents…
          </li>
        )}
      </ol>
    </div>
  )
}

export function buildSubmitPipelineSteps(): AgentStep[] {
  return ORDER.map((id, i) => ({
    id,
    label: {
      intake: 'Intake Agent',
      vision: 'Vision Agent',
      dedup: 'Dedup Agent',
      routing: 'Routing Agent',
      communicator: 'Communicator Agent',
      insights: 'Insights Agent',
    }[id]!,
    status: i === 0 ? 'running' : 'pending',
  }))
}

export function mergePipelineSteps(base: AgentStep[], incoming: AgentStep[]): AgentStep[] {
  const map = new Map(base.map((s) => [s.id, s]))
  for (const s of incoming) map.set(s.id, { ...map.get(s.id), ...s, status: 'done' as const })
  return ORDER.map((id) => map.get(id)).filter(Boolean) as AgentStep[]
}
