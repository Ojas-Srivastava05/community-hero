import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { resolveIsAdmin } from './admin'

type AdminModeValue = {
  isAdmin: boolean
  checking: boolean
}

const AdminModeContext = createContext<AdminModeValue>({ isAdmin: false, checking: true })

/** Citizen-primary routes — authorities belong in /admin, not here. */
const CITIZEN_HOME_ROUTES = new Set([
  '/',
  '/login',
  '/profile',
  '/dashboard',
  '/activity',
  '/my-reports',
  '/report',
  '/assistant',
  '/leaderboard',
  '/scorecards',
  '/notifications',
  '/gamification-rules',
  '/waiting',
])

export function isCitizenHomeRoute(pathname: string): boolean {
  if (CITIZEN_HOME_ROUTES.has(pathname)) return true
  if (pathname.startsWith('/report')) return true
  return false
}

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const prevUidRef = useRef<string | undefined>(undefined)

  // Reset before paint when Firebase user changes (prevents citizen UI flash).
  useLayoutEffect(() => {
    const uid = user?.uid
    if (uid === prevUidRef.current) return
    prevUidRef.current = uid
    if (user) {
      setIsAdmin(false)
      setChecking(true)
    }
  }, [user?.uid, user])

  useEffect(() => {
    if (loading) {
      setChecking(true)
      return
    }
    if (!user) {
      setIsAdmin(false)
      setChecking(false)
      return
    }
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (cancelled) return
      setIsAdmin(false)
      setChecking(false)
    }, 8000)
    resolveIsAdmin(user).then((admin) => {
      if (cancelled) return
      window.clearTimeout(timeout)
      setIsAdmin(admin)
      setChecking(false)
    })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [user?.uid, loading, user])

  return (
    <AdminModeContext.Provider value={{ isAdmin, checking }}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode() {
  return useContext(AdminModeContext)
}

/** Keep signed-in authorities out of citizen home/report/profile flows. */
export function AdminRouteGuard() {
  const { user, loading } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || checking) return
    if (!user || !isAdmin) return
    if (isCitizenHomeRoute(pathname)) {
      navigate('/admin', { replace: true })
    }
  }, [user, loading, checking, isAdmin, pathname, navigate])

  return null
}

/** Block page render until we know if the user is an authority (prevents citizen UI flash). */
export function AuthorityGate({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { user, loading } = useAuth()
  const { isAdmin, checking } = useAdminMode()

  if (loading || (user && checking)) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      )
    )
  }
  if (user && isAdmin) return null
  return <>{children}</>
}
