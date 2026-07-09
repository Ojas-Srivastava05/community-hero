import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { LanguagePicker, useI18n } from '../lib/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Sign-in failed. Please try again.'
}

export function LoginPage() {
  const { user, signInWithGoogle, signInWithDemo, signInAsGuest, signingIn, configured } = useAuth()
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)
  if (user) return <Navigate to="/" replace />

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-20 text-center"
      >
        <div className="mb-6 flex justify-center">
          <LanguagePicker />
        </div>
        <h1 className="display text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Report issues, earn civic points, and chat with Civic AI — or try the demo instantly.</p>
        {!configured && (
          <p className="mt-4 rounded-xl border border-coral/30 bg-coral-soft px-3 py-2 text-left text-xs text-coral" role="alert">
            Firebase is not configured in this build. Demo sign-in will not work until the app is redeployed with VITE_FIREBASE_* keys.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-coral/30 bg-coral-soft px-3 py-2 text-left text-xs text-coral" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithDemo('citizen'))}
            className="w-full rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow"
          >
            {signingIn ? 'Signing in…' : t('login.demoCitizen')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithDemo('admin'))}
            className="w-full rounded-2xl border border-coral/40 bg-coral-soft py-4 text-sm font-bold text-coral"
          >
            {t('login.demoAdmin')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInAsGuest())}
            className="w-full rounded-2xl border border-rule py-4 text-sm font-bold text-ink"
          >
            {signingIn ? 'Signing in…' : t('login.guest')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithGoogle())}
            className="w-full rounded-2xl border border-rule py-4 text-sm font-bold text-ink"
          >
            {signingIn ? 'Opening Google…' : t('login.google')}
          </button>
        </div>
        <p className="mt-6 text-xs text-ink-muted">
          By signing in you agree to our <Link to="/terms" className="text-coral underline">terms</Link>.
        </p>
      </motion.div>
    </AppShell>
  )
}
