import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { AdminNav } from './AdminNav'
import { AdminRegionPicker } from '@/components/civic/AdminRegionPicker'
import { LanguagePicker } from '@/lib/i18n'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function AdminShell({
  children,
  className,
  title,
  subtitle,
  right,
  showRegionPicker = true,
}: {
  children: ReactNode
  className?: string
  title: string
  subtitle?: string
  right?: ReactNode
  showRegionPicker?: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden bg-[oklch(0.97_0.01_275)]">
      <header className="sticky top-0 z-30 border-b border-indigo/15 bg-ink text-paper">
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-soft">
              <Shield className="size-3.5" />
              {t('admin.shell.badge')}
            </div>
            <h1 className="display mt-1 truncate text-xl font-bold">{title}</h1>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-paper/70">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <LanguagePicker compact className="[&_select]:border-paper/25 [&_select]:bg-ink [&_select]:text-paper" />
              {right}
            </div>
            {showRegionPicker ? <AdminRegionPicker compact /> : null}
            <Link to="/map" className="text-[10px] font-semibold text-paper/50 hover:text-paper">
              {t('admin.shell.mapOnly')}
            </Link>
          </div>
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative z-10 px-5 pt-4 pb-28', className)}
      >
        {children}
      </motion.main>
      <AdminNav />
    </div>
  )
}
