import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useAdminMode } from '@/lib/admin-mode'
import { useAdminRegion } from '@/lib/admin-region'
import {
  RoleOnboardingModal,
  isOnboardingDismissed,
} from './RoleOnboardingModal'

/** Shows role-specific onboarding once per device after sign-in. */
export function RoleOnboardingHost() {
  const { user, loading } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { regionId, setRegionId } = useAdminRegion()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'citizen'>('citizen')

  useEffect(() => {
    if (loading || checking || !user) {
      setOpen(false)
      return
    }
    if (isAdmin) {
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
  }, [user, loading, isAdmin, checking])

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
