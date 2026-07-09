import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Bell, ChevronRight, FileText, Lock, Settings, Shield, Sparkles, Trophy } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { useAuth } from '../lib/auth'
import { useAdminMode } from '../lib/admin-mode'
import { useI18n } from '../lib/i18n'
import { useLocation } from '../lib/location'
import { apiGetProfile, apiListNotifications, apiUpdateProfile } from '../lib/api'
import { resolveIsAdmin } from '../lib/admin'
import { fadeUp, stagger } from '../lib/motion'
import { cn } from '@/lib/utils'

const ALL_BADGES = [
  { name: 'First Reporter', desc: 'Submit your first civic report' },
  { name: 'Neighborhood Voice', desc: 'Earn 3 upvotes on a report' },
  { name: 'Duplicate Hunter', desc: 'Merge into an existing report' },
  { name: 'Verified Voice', desc: 'Give 50 community boosts' },
  { name: 'Fix Follower', desc: 'Your report gets resolved' },
  { name: 'Ward Guardian', desc: '5 reports in the same ward' },
  { name: 'Civic Champion', desc: 'Reach 100+ civic points' },
] as const

export function ProfilePage() {
  const { user, signInWithGoogle, logout, signingIn } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { t } = useI18n()
  const { location } = useLocation()
  const [admin, setAdmin] = useState(false)
  const [points, setPoints] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false)
  const [savingOptIn, setSavingOptIn] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (!user) {
      setAdmin(false)
      return
    }
    let cancelled = false
    resolveIsAdmin(user).then((isAdmin) => {
      if (!cancelled) setAdmin(isAdmin)
    })
    user.getIdToken().then((t) =>
      apiGetProfile(t).then((p) => {
        if (!p) return
        setPoints(p.civicPoints ?? 0)
        setBadges(p.badges ?? [])
        setLeaderboardOptIn(p.leaderboardOptIn ?? false)
      }),
    )
    user.getIdToken().then((t) =>
      apiListNotifications(t, 1).then((n) => setUnreadNotifications(n.unreadCount)).catch(() => {}),
    )
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleLeaderboard = async () => {
    if (!user || savingOptIn) return
    const next = !leaderboardOptIn
    setSavingOptIn(true)
    try {
      const token = await user.getIdToken()
      await apiUpdateProfile(token, { leaderboardOptIn: next })
      setLeaderboardOptIn(next)
    } catch {
      /* ignore */
    } finally {
      setSavingOptIn(false)
    }
  }

  const initials = user?.displayName?.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() || 'CH'
  const areaLabel = location?.label || 'Near you'

  if (user && checking) {
    return (
      <AppShell>
        <PageHeader title={t('profile.title')} />
        <div className="px-5 py-16 text-center text-sm text-ink-muted">Loading…</div>
      </AppShell>
    )
  }
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <AppShell>
      <PageHeader title={t('profile.title')} />
      <motion.section variants={stagger} initial="hidden" animate="show" className="px-5 pt-4">
        <motion.div variants={fadeUp}>
          <GlassCard className="text-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Profile photo'} className="mx-auto size-20 rounded-full object-cover ring-2 ring-coral/40" />
            ) : (
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-coral/40 to-coral/10 ring-2 ring-coral/40 text-2xl font-extrabold text-coral">
                {initials}
              </div>
            )}
            <p className="display mt-3 text-base font-bold text-ink">{user?.displayName || 'Guest'}</p>
            <p className="text-xs text-ink-muted">{user?.email || areaLabel}</p>
            {user && (
              <div className="mt-3 flex justify-center gap-2">
                <Chip tone="coral"><Award className="size-3" />{points} civic points</Chip>
              </div>
            )}
          </GlassCard>
        </motion.div>
        {user ? (
          <motion.button variants={fadeUp} type="button" onClick={() => logout()} className="mt-4 w-full rounded-2xl border border-rule bg-paper py-3 text-sm font-bold text-ink">
            Sign out
          </motion.button>
        ) : (
          <motion.button variants={fadeUp} type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-coral py-3 text-sm font-bold text-paper ink-glow">
            <GoogleIcon />
            {signingIn ? 'Opening Google…' : 'Sign in with Google'}
          </motion.button>
        )}
      </motion.section>

      {user && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 space-y-2 px-5">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Badges</p>
          <motion.div variants={fadeUp}>
            <GlassCard className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-coral" />
                <p className="text-xs font-bold text-ink">Your achievements</p>
                <Lock className="ml-auto size-3 text-ink-muted" />
                <span className="text-[10px] text-ink-muted">Private</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_BADGES.map((b) => {
                  const earned = badges.includes(b.name)
                  return (
                    <div
                      key={b.name}
                      className={cn(
                        'rounded-xl border px-3 py-2.5',
                        earned ? 'border-coral/30 bg-coral-soft/40' : 'border-rule bg-surface opacity-60',
                      )}
                    >
                      <p className={cn('text-xs font-bold', earned ? 'text-coral' : 'text-ink-muted')}>{b.name}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-ink-muted">{b.desc}</p>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          </motion.div>
        </motion.section>
      )}

      <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 space-y-2 px-5">
        <Row to="/my-reports" icon={FileText} label="My reports" />
        <Row
          to="/notifications"
          icon={Bell}
          label="Notifications"
          hint={unreadNotifications > 0 ? `${unreadNotifications} unread` : 'Status alerts'}
        />
        <Row to="/leaderboard" icon={Award} label="Leaderboard" />
        <Row to="/dashboard" icon={Sparkles} label="Civic dashboard" />
        <Row to="/scorecards" icon={Award} label="Department scorecards" hint="A–D grades" />
        <Row to="/assistant" icon={Sparkles} label="Civic AI assistant" hint="New" />
        {admin && <Row to="/admin" icon={Shield} label="Admin console" />}
      </motion.section>
      <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 space-y-2 px-5">
        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Settings</p>
        {user && (
          <motion.div variants={fadeUp}>
            <button
              type="button"
              disabled={savingOptIn}
              onClick={toggleLeaderboard}
              className="paper w-full text-left transition-transform active:scale-[0.99]"
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <div className="grid size-9 place-items-center rounded-lg border border-rule bg-surface">
                  <Trophy className="size-4 text-ink" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">Show on leaderboard</p>
                  <p className="truncate text-[11px] text-ink-muted">Opt-in only · ethics-first</p>
                </div>
                <div
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    leaderboardOptIn ? 'bg-coral' : 'bg-rule',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-paper shadow transition-transform',
                      leaderboardOptIn ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </div>
              </div>
            </button>
          </motion.div>
        )}
        <Row to="/gamification-rules" icon={Award} label="Gamification rules" hint="Points & badges" />
        <Row to="/terms" icon={FileText} label="Terms of use" />
        <Row to="/privacy" icon={Shield} label="Privacy policy" />
        <Row to="/activity" icon={Bell} label="Activity & alerts" hint="Nearby threads" />
        <Row to="/login" icon={Settings} label="Account" hint={user ? 'Signed in' : 'Sign in / demo'} />
      </motion.section>
      <p className="mt-6 px-5 pb-2 text-center text-[10px] text-ink-muted">Community Hero · CIVICPULSE AI · Vibe2Ship</p>
    </AppShell>
  )
}

function Row({ icon: Icon, label, hint, to }: { icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; to?: string }) {
  const inner = (
    <motion.div variants={fadeUp} className="paper grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-transform active:scale-[0.99]">
      <div className="grid size-9 place-items-center rounded-lg border border-rule bg-surface"><Icon className="size-4 text-ink" /></div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="truncate text-[11px] text-ink-muted">{hint}</p>}
      </div>
      <ChevronRight className="size-4 text-ink-muted" />
    </motion.div>
  )
  return to ? <Link to={to}>{inner}</Link> : <button type="button" className="w-full text-left">{inner}</button>
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.07 5.07 0 0 1-2.2 3.33v2.77h3.55c2.08-1.92 3.23-4.74 3.23-8.34z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.27-2.66l-3.55-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
