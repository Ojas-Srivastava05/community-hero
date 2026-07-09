import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function LoginPage() {
  const { user, signInWithGoogle, signInWithDemo, signingIn } = useAuth()
  const { t, locale, setLocale } = useI18n()
  if (user) return <Navigate to="/profile" replace />

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-20 text-center"
      >
        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
          className="mb-6 rounded-full border border-rule px-3 py-1 text-xs font-semibold text-ink-muted"
        >
          {t('lang.toggle')}
        </button>
        <h1 className="display text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Report issues, earn civic points, and chat with Civic AI — or try the demo instantly.</p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithDemo('citizen')}
            className="w-full rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow"
          >
            {signingIn ? 'Signing in…' : t('login.demoCitizen')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
            className="w-full rounded-2xl border border-coral/40 bg-coral-soft py-4 text-sm font-bold text-coral"
          >
            {t('login.demoAdmin')}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
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
