import { NavLink, useLocation } from 'react-router-dom'
import { Camera, Home, Map, User, Activity } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/report', icon: Camera, label: 'Report', fab: true },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg px-4 pb-6">
      <div className="glass relative flex items-end justify-around rounded-[34px] px-2 py-3">
        {tabs.map(({ to, icon: Icon, label, fab }) => {
          if (fab) {
            return (
              <NavLink
                key={to}
                to={to}
                className="relative -mt-8 flex flex-col items-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-midnight shadow-[0_0_24px_rgba(20,184,166,0.45)] transition-transform active:scale-95">
                  <Icon size={24} strokeWidth={2.25} />
                </span>
                <span className="mt-1 text-[10px] font-medium text-mist">{label}</span>
              </NavLink>
            )
          }
          const active = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={22}
                className={active ? 'text-teal' : 'text-mist'}
                strokeWidth={active ? 2.25 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-teal' : 'text-mist'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
