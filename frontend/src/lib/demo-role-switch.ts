import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'

/** Swap demo Firebase accounts and land on the right home surface. */
export function useDemoRoleSwitch() {
  const { signInWithDemo, signingIn } = useAuth()
  const navigate = useNavigate()

  const switchToCitizen = useCallback(async () => {
    await signInWithDemo('citizen')
    navigate('/', { replace: true })
  }, [signInWithDemo, navigate])

  const switchToAdmin = useCallback(async () => {
    await signInWithDemo('admin')
    navigate('/admin', { replace: true })
  }, [signInWithDemo, navigate])

  return { switchToCitizen, switchToAdmin, switching: signingIn }
}
