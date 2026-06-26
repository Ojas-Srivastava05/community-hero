import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { cn } from '@/lib/utils'

const FULLSCREEN_ROUTES = ['/assistant', '/report']

export function AppShell({
  children,
  className,
  bare,
  hideNav,
}: {
  children: ReactNode
  className?: string
  /** Skip bottom padding (full-bleed layouts). */
  bare?: boolean
  /** Hide bottom tab bar (chat, wizard). */
  hideNav?: boolean
}) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden">
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn('relative z-10', bare || hideNav ? '' : 'safe-bottom', className)}
      >
        {children}
      </motion.main>
      {!hideNav ? <BottomNav hiddenOn={FULLSCREEN_ROUTES} /> : null}
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
    <header className="sticky top-0 z-30 border-b border-rule bg-background/85 backdrop-blur-md">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
        <div className="min-w-0">
          <h1 className="display truncate text-2xl font-bold text-ink">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs font-medium text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  )
}
