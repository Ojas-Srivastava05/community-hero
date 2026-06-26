import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('paper p-4', className)} {...props} />
}

export const PaperCard = GlassCard

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
    <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        <h2 className="display truncate text-xl font-bold text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs font-medium text-ink-muted">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-xs font-bold text-coral">{action}</div> : null}
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
  tone?: 'default' | 'teal' | 'coral' | 'indigo' | 'leaf' | 'amber' | 'warn' | 'danger' | 'ok'
}) {
  const toneClass = {
    default: '',
    teal: 'bg-coral-soft text-coral border-coral/30',
    coral: 'bg-coral-soft text-coral border-coral/30',
    indigo: 'bg-indigo-soft text-indigo border-indigo/30',
    leaf: 'bg-leaf-soft text-leaf border-leaf/30',
    amber: 'bg-amber-soft text-amber border-amber/40',
    warn: 'bg-amber-soft text-amber border-amber/40',
    danger: 'bg-[oklch(0.94_0.06_25)] text-[oklch(0.5_0.22_25)] border-[oklch(0.5_0.22_25/0.35)]',
    ok: 'bg-leaf-soft text-leaf border-leaf/30',
  }[tone]
  return <span className={cn('chip', toneClass, className)}>{children}</span>
}
