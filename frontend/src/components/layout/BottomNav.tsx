import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, Activity, User, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useAdminMode } from '@/lib/admin-mode'
import { AdminNav } from './AdminNav'

function useTabs() {
  const { t } = useI18n()
  return [
    { to: '/', label: t('nav.home'), icon: Home, end: true as const },
    { to: '/map', label: t('nav.map'), icon: Map, end: false as const },
    { to: '/activity', label: t('nav.activity'), icon: Activity, end: false as const },
    { to: '/profile', label: t('nav.profile'), icon: User, end: false as const },
  ]
}

export function BottomNav({ hiddenOn = [] }: { hiddenOn?: string[] }) {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const { user } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const tabs = useTabs()
  if (hiddenOn.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return null
  }
  if (pathname === '/login') {
    return null
  }
  if (user && checking) {
    return null
  }
  if (isAdmin) {
    return <AdminNav />
  }
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[440px] justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto relative mx-3 mb-3 grid w-full grid-cols-5 items-end rounded-[28px] border border-rule bg-paper/95 px-2 py-2 backdrop-blur-md shadow-[0_-2px_30px_-10px_oklch(0.18_0.04_270/0.18),0_1px_0_oklch(1_0_0/0.6)_inset]">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} active={isActive(pathname, t.to, t.end)} />
        ))}
        <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05, rotate: 4 }} className="relative mx-auto -mt-8">
          <NavLink
            to="/report"
            aria-label={t('nav.report')}
            className="relative grid size-16 place-items-center rounded-full bg-coral text-paper ink-glow"
          >
            <span className="absolute inset-0 -z-10 rounded-full bg-coral/40 blur-xl" />
            <Plus className="size-8" strokeWidth={2.6} />
          </NavLink>
        </motion.div>
        {tabs.slice(2).map((t) => (
          <NavItem key={t.to} {...t} active={isActive(pathname, t.to, t.end)} />
        ))}
      </div>
    </nav>
  )
}

function isActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}) {
  return (
    <NavLink
      to={to}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors',
        active ? 'text-coral' : 'text-ink-muted hover:text-ink',
      )}
    >
      <Icon className={cn('size-5', active && 'scale-110 transition-transform')} />
      {label}
      {active ? (
        <motion.span
          layoutId="nav-dot"
          className="absolute -bottom-0.5 size-1 rounded-full bg-coral"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      ) : null}
    </NavLink>
  )
}
