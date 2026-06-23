import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  className,
  bare,
}: {
  children: ReactNode
  className?: string
  bare?: boolean
}) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden">
      <main className={cn(bare ? '' : 'safe-bottom', className)}>{children}</main>
      <BottomNav />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 glass-strong">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  )
}
