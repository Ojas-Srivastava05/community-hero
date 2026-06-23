import { useAuth } from '../lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Link, Navigate } from 'react-router-dom'

export function LoginPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  if (user) return <Navigate to="/profile" replace />

  return (
    <AppShell>
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use Google to report issues, earn civic points, and chat with Civic AI.</p>
        <button
          type="button"
          disabled={signingIn}
          onClick={() => signInWithGoogle()}
          className="mt-8 w-full rounded-2xl bg-teal py-4 text-sm font-bold text-primary-foreground teal-glow"
        >
          {signingIn ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <p className="mt-6 text-xs text-muted-foreground">
          By signing in you agree to our <Link to="/terms" className="text-teal underline">terms</Link>.
        </p>
      </div>
    </AppShell>
  )
}
