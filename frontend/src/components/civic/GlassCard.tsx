import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass p-4', className)} {...props} />
}

export function SectionHeader({
  title,
  action,
  hint,
}: {
  title: string
  action?: ReactNode
  hint?: string
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold tracking-tight">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-xs font-semibold text-teal">{action}</div> : null}
    </div>
  )
}

export function Chip({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode
  className?: string
  tone?: 'default' | 'teal' | 'warn' | 'danger' | 'ok'
}) {
  const toneClass = {
    default: '',
    teal: 'bg-teal/15 text-teal border-teal/30',
    warn: 'bg-sev-med/15 text-sev-med border-sev-med/30',
    danger: 'bg-sev-critical/15 text-sev-critical border-sev-critical/40',
    ok: 'bg-sev-low/15 text-sev-low border-sev-low/30',
  }[tone]
  return <span className={cn('chip', toneClass, className)}>{children}</span>
}
