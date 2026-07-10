import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAdminMode } from '../lib/admin-mode'
import { useDemoRoleSwitch } from '../lib/demo-role-switch'
import { useI18n } from '../lib/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { NoLoginCallout } from '@/components/civic/NoLoginFeature'
import { motion } from 'framer-motion'
import { Shield, UserRound } from 'lucide-react'

function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Sign-in failed. Please try again.'
}

export function LoginPage() {
  const { user, signInWithGoogle, signInWithDemo, signInAsGuest, signingIn, logout, configured } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { switchToCitizen, switchToAdmin, switching } = useDemoRoleSwitch()
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  if (user && (signingIn || switching)) {
    return (
      <AppShell hideNav>
        <div className="flex min-h-[60vh] items-center justify-center px-5 text-sm text-ink-muted">
          Switching account…
        </div>
      </AppShell>
    )
  }

  if (user && checking) {
    return (
      <AppShell hideNav>
        <div className="flex min-h-[60vh] items-center justify-center px-5 text-sm text-ink-muted">
          Checking access…
        </div>
      </AppShell>
    )
  }

  if (user) {
    return (
      <AppShell hideNav>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pb-12 pt-16 text-center"
        >
          <h1 className="display text-2xl font-bold text-ink">Account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Signed in as{' '}
            <span className="font-semibold text-ink">
              {isAdmin ? 'Demo Authority' : user.isAnonymous ? 'Guest' : 'Demo Citizen'}
            </span>
          </p>
          {error && (
            <p className="mt-4 rounded-xl border border-coral/30 bg-coral-soft px-3 py-2 text-left text-xs text-coral" role="alert">
              {error}
            </p>
          )}
          <div className="mt-6 space-y-3">
            <Link
              to={isAdmin ? '/admin' : '/'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo py-4 text-sm font-bold text-paper"
            >
              {isAdmin ? (
                <>
                  <Shield className="size-4" /> Open authority console
                </>
              ) : (
                <>
                  <UserRound className="size-4" /> Continue as citizen
                </>
              )}
            </Link>
            {!isAdmin && (
              <button
                type="button"
                disabled={signingIn || switching}
                onClick={() => run(() => switchToAdmin())}
                className="w-full rounded-2xl border border-indigo/40 bg-indigo-soft py-3 text-sm font-bold text-indigo"
              >
                {t('login.demoAdmin')}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                disabled={signingIn || switching}
                onClick={() => run(() => switchToCitizen())}
                className="w-full rounded-2xl border border-coral/40 bg-coral-soft py-3 text-sm font-bold text-coral"
              >
                {t('login.switchToCitizen')}
              </button>
            )}
            <button
              type="button"
              disabled={signingIn || switching}
              onClick={() => run(() => logout())}
              className="w-full rounded-2xl border border-rule py-3 text-xs font-semibold text-ink-muted"
            >
              Sign out
            </button>
          </div>
        </motion.div>
      </AppShell>
    )
  }

  return (
    <AppShell hideNav>
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
            className="w-full rounded-2xl border border-indigo/40 bg-indigo-soft py-3 text-sm font-bold text-indigo"
          >
            {signingIn ? 'Signing in…' : t('login.demoAdmin')}
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
