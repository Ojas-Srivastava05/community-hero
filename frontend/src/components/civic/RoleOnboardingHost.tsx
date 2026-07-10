import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useAdminMode } from '@/lib/admin-mode'
import { useAdminRegion } from '@/lib/admin-region'
import {
  RoleOnboardingModal,
  isOnboardingDismissed,
} from './RoleOnboardingModal'

/** Shows role-specific onboarding once per device after sign-in. */
export function RoleOnboardingHost() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { regionId, setRegionId } = useAdminRegion()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'citizen'>('citizen')

  const isAdminConsoleRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    if (loading || checking || !user) {
      setOpen(false)
      return
    }
    if (isAdmin) {
      // Map is a citizen surface — don't block marker taps with authority onboarding.
      if (!isAdminConsoleRoute) {
        setOpen(false)
        return
      }
      if (!isOnboardingDismissed('admin')) {
        setRole('admin')
        setOpen(true)
      }
      return
    }
    if (!isOnboardingDismissed('citizen')) {
      setRole('citizen')
      setOpen(true)
    }
  }, [user, loading, isAdmin, checking, isAdminConsoleRoute])

  if (!user) return null

  return (
    <RoleOnboardingModal
      open={open}
      role={role}
      onClose={() => setOpen(false)}
      adminRegionId={regionId}
      onAdminRegionChange={setRegionId}
    />
  )
}
