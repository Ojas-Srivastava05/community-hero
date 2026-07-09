import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, LogOut, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

const TABS = [
  { to: '/admin', label: 'Queue', icon: ClipboardList, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/map', label: 'Map', icon: Map, end: false },
] as const

export function AdminNav() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <nav
      aria-label="Authority navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[440px] justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto mx-3 mb-3 flex w-full items-center gap-1 rounded-[28px] border border-indigo/20 bg-ink px-2 py-2 text-paper shadow-lg">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-bold transition-colors',
              (tab.end ? pathname === tab.to : pathname.startsWith(tab.to))
                ? 'bg-indigo text-paper'
                : 'text-paper/70 hover:text-paper',
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => logout()}
          className="flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[10px] font-bold text-paper/60 hover:text-paper"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
          Exit
        </button>
      </div>
    </nav>
  )
}
