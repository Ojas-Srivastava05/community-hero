import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useAuth } from './auth'
import { apiCheckAdmin } from './api'

export async function resolveIsAdmin(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult(true)
  if (tokenResult.claims.admin === true) return true
  const token = await user.getIdToken(true)
  return apiCheckAdmin(token)
}

export function useRequireAdmin(redirectTo = '/dashboard', options?: { redirect?: boolean }) {
  const { user, loading, signInWithGoogle, signInWithDemo, signingIn } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const shouldRedirect = options?.redirect !== false

  useEffect(() => {
    if (loading) return
    if (!user) {
      setIsAdmin(false)
      setChecking(false)
      return
    }
    let cancelled = false
    resolveIsAdmin(user).then((admin) => {
      if (cancelled) return
      setIsAdmin(admin)
      setChecking(false)
      if (!admin && shouldRedirect) navigate(redirectTo, { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [user, loading, navigate, redirectTo, shouldRedirect])

  const accessDenied = !loading && !checking && Boolean(user) && !isAdmin

  return {
    user,
    loading: loading || checking,
    isAdmin,
    accessDenied,
    signInWithGoogle,
    signInWithDemo,
    signingIn,
  }
}
