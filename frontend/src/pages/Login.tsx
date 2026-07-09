import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { NoLoginCallout } from '@/components/civic/NoLoginFeature'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PostLoginRedirect } from '../lib/post-login-redirect'

function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Sign-in failed. Please try again.'
}

export function LoginPage() {
  const { user, signInWithGoogle, signInWithDemo, signInAsGuest, signingIn, configured } = useAuth()
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)
  if (user) return <PostLoginRedirect />

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
        className="px-5 pb-12 pt-16 text-center"
      >
        <h1 className="display text-2xl font-bold text-ink">{t('feature.noLogin.title')}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t('feature.noLogin.hint')}</p>
        <div className="mt-5">
          <NoLoginCallout />
        </div>
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
        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithDemo('citizen'))}
            className="w-full rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow"
          >
            {signingIn ? 'Starting…' : t('login.demoCitizen')}
          </button>
          <p className="text-center text-[11px] text-ink-muted">{t('report.demoCitizenHint')}</p>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInAsGuest())}
            className="w-full rounded-2xl border border-leaf/35 bg-leaf-soft py-4 text-sm font-bold text-leaf"
          >
            {signingIn ? 'Starting…' : t('feature.noLogin.guest')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithDemo('admin'))}
            className="w-full rounded-2xl border border-coral/40 bg-coral-soft py-3 text-sm font-bold text-coral"
          >
            {t('login.demoAdmin')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => run(() => signInWithGoogle())}
            className="w-full rounded-2xl border border-rule py-3 text-xs font-semibold text-ink-muted"
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
