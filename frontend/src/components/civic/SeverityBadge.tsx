import { cn } from '@/lib/utils'
import { severityLabel, type Severity } from '@/lib/issue-ui'

/** WCAG AA contrast — foreground/background pairs ≥ 4.5:1 */
const severityClass: Record<Severity, string> = {
  low: 'bg-[oklch(0.92_0.04_150)] text-[oklch(0.32_0.08_150)] border-[oklch(0.32_0.08_150/0.35)]',
  med: 'bg-[oklch(0.93_0.06_85)] text-[oklch(0.38_0.12_75)] border-[oklch(0.38_0.12_75/0.4)]',
  high: 'bg-[oklch(0.93_0.05_36)] text-[oklch(0.42_0.16_36)] border-[oklch(0.42_0.16_36/0.35)]',
  critical:
    'bg-[oklch(0.94_0.06_25)] text-[oklch(0.38_0.2_25)] border-[oklch(0.38_0.2_25/0.4)]',
}

const dotClass: Record<Severity, string> = {
  low: 'bg-[oklch(0.32_0.08_150)]',
  med: 'bg-[oklch(0.38_0.12_75)]',
  high: 'bg-[oklch(0.42_0.16_36)]',
  critical: 'bg-[oklch(0.42_0.22_22)] animate-pulse',
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
      <span className={cn('size-1.5 rounded-full', dotClass[severity])} aria-hidden />
      {severityLabel(severity)}
    </span>
  )
}
