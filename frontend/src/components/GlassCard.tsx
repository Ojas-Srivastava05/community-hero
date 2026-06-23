import type { ReactNode } from 'react'

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`glass-card rounded-3xl p-4 ${className}`}>{children}</div>
  )
}

export function SeverityDot({ level }: { level: 'critical' | 'high' | 'medium' | 'low' }) {
  const colors = {
    critical: 'bg-critical',
    high: 'bg-high',
    medium: 'bg-medium',
    low: 'bg-low',
  }
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[level]}`} />
}

export function StatusChip({ children, variant = 'outline' }: { children: ReactNode; variant?: 'outline' | 'filled' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
        variant === 'filled'
          ? 'bg-low/20 text-low'
          : 'border border-teal/40 text-teal'
      }`}
    >
      {children}
    </span>
  )
}
