import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAdminMode } from './admin-mode'

/** After sign-in, citizens go home; authorities go straight to the operations console. */
export function PostLoginRedirect() {
  const { user } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  if (!user) return null
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-ink-muted">
        Opening console…
      </div>
    )
  }
  return <Navigate to={isAdmin ? '/admin' : '/'} replace />
}
