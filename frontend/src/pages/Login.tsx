import { useAuth } from '../lib/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function LoginPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  if (user) return <Navigate to="/profile" replace />

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-20 text-center"
      >
        <h1 className="display text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Use Google to report issues, earn civic points, and chat with Civic AI.</p>
        <button
          type="button"
          disabled={signingIn}
          onClick={() => signInWithGoogle()}
          className="mt-8 w-full rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow"
        >
          {signingIn ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <p className="mt-6 text-xs text-ink-muted">
          By signing in you agree to our <Link to="/terms" className="text-coral underline">terms</Link>.
        </p>
      </motion.div>
    </AppShell>
  )
}
