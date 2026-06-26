import { cn } from '@/lib/utils'
import { severityLabel, type Severity } from '@/lib/issue-ui'

const severityClass: Record<Severity, string> = {
  low: 'bg-leaf-soft text-leaf border-leaf/30',
  med: 'bg-amber-soft text-amber border-amber/40',
  high: 'bg-coral-soft text-coral border-coral/30',
  critical: 'bg-[oklch(0.94_0.06_25)] text-[oklch(0.5_0.22_25)] border-[oklch(0.5_0.22_25/0.35)]',
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
        severityClass[severity],
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          severity === 'low' && 'bg-leaf',
          severity === 'med' && 'bg-amber',
          severity === 'high' && 'bg-coral',
          severity === 'critical' && 'bg-[oklch(0.55_0.24_22)] animate-pulse',
        )}
      />
      {severityLabel(severity)}
    </span>
  )
}
