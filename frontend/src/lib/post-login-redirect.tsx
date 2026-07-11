import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import { useAdminMode } from './admin-mode'

/** After sign-in, citizens go home; authorities go straight to the operations console. */
export function PostLoginRedirect() {
  const { user, signingIn } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  if (!user) return null
  if (signingIn || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-ink-muted">
        Opening console…
      </div>
    )
  }
  return <Navigate to={isAdmin ? '/admin' : '/'} replace />
}
