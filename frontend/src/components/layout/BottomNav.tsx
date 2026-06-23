import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, Activity, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[440px] justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto relative mx-3 mb-3 grid w-full grid-cols-5 items-end glass-strong rounded-2xl px-2 py-2">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} active={isActive(pathname, t.to, t.end)} />
        ))}
        <NavLink
          to="/report"
          aria-label="Report issue"
          className="relative mx-auto -mt-7 grid size-14 place-items-center rounded-full bg-teal text-primary-foreground teal-glow transition-transform active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.6} />
        </NavLink>
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
        'flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors',
        active ? 'text-teal' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}
