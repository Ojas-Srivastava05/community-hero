import { cn } from '@/lib/utils'
import { severityClass, severityLabel, type Severity } from '@/lib/issue-ui'

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        severityClass(severity),
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          severity === 'low' && 'bg-sev-low',
          severity === 'med' && 'bg-sev-med',
          severity === 'high' && 'bg-sev-high',
          severity === 'critical' && 'bg-sev-critical animate-pulse',
        )}
      />
      {severityLabel(severity)}
    </span>
  )
}
