import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useAuth } from './auth'
import { apiCheckAdmin } from './api'

export async function resolveIsAdmin(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult()
  if (tokenResult.claims.admin === true) return true
  const token = await user.getIdToken()
  return apiCheckAdmin(token)
}

export function useRequireAdmin(redirectTo = '/dashboard') {
  const { user, loading, signInWithGoogle, signingIn } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
      if (!admin) navigate(redirectTo, { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [user, loading, navigate, redirectTo])

  const accessDenied = !loading && !checking && Boolean(user) && !isAdmin

  return { user, loading: loading || checking, isAdmin, accessDenied, signInWithGoogle, signingIn }
}
