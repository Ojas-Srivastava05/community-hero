import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Bell, ChevronRight, FileText, Settings, Shield, Sparkles } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { useAuth } from '../lib/auth'
import { useLocation } from '../lib/location'
import { apiGetProfile } from '../lib/api'

export function ProfilePage() {
  const { user, signInWithGoogle, logout, signingIn } = useAuth()
  const { location } = useLocation()
  const [admin, setAdmin] = useState(false)
  const [points, setPoints] = useState(0)

  useEffect(() => {
    if (!user) return
    user.getIdTokenResult().then((r) => setAdmin(!!r.claims.admin))
    user.getIdToken().then((t) => apiGetProfile(t).then((p) => setPoints(p?.civicPoints ?? 0)))
  }, [user])

  const initials = user?.displayName?.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() || 'CH'
  const areaLabel = location?.label || 'Near you'

  return (
    <AppShell>
      <PageHeader title="Profile" />
      <section className="px-5 pt-4">
        <GlassCard className="text-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="mx-auto size-20 rounded-full object-cover ring-2 ring-teal/40" />
          ) : (
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-teal/40 to-teal/10 ring-2 ring-teal/40 text-2xl font-extrabold text-teal teal-glow">
              {initials}
            </div>
          )}
          <p className="mt-3 text-base font-bold">{user?.displayName || 'Guest'}</p>
          <p className="text-xs text-muted-foreground">{user?.email || areaLabel}</p>
          {user && (
            <div className="mt-3 flex justify-center gap-2">
              <Chip tone="teal"><Award className="size-3" />{points} civic points</Chip>
            </div>
          )}
        </GlassCard>
        {user ? (
          <button type="button" onClick={() => logout()} className="mt-4 w-full rounded-2xl border border-glass-border bg-glass py-3 text-sm font-bold">
            Sign out
          </button>
        ) : (
          <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-glass-border bg-glass py-3 text-sm font-bold">
            <GoogleIcon />
            {signingIn ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        )}
      </section>
      <section className="mt-6 space-y-2 px-5">
        <Row to="/my-reports" icon={FileText} label="My reports" />
        <Row to="/leaderboard" icon={Award} label="Leaderboard" />
        <Row to="/dashboard" icon={Sparkles} label="Civic dashboard" />
        <Row to="/assistant" icon={Sparkles} label="Civic AI assistant" hint="New" />
        {admin && <Row to="/admin" icon={Shield} label="Admin console" />}
      </section>
      <section className="mt-6 space-y-2 px-5">
        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Settings</p>
        <Row to="/terms" icon={FileText} label="Terms & gamification" />
        <Row icon={Bell} label="Notifications" hint="Area alerts" />
        <Row icon={Settings} label="Preferences" />
      </section>
      <p className="mt-6 px-5 pb-2 text-center text-[10px] text-muted-foreground">CivicPulse AI · Community Hero · Vibe2Ship</p>
    </AppShell>
  )
}

function Row({ icon: Icon, label, hint, to }: { icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; to?: string }) {
  const inner = (
    <div className="glass grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
      <div className="grid size-9 place-items-center rounded-lg border border-glass-border bg-glass"><Icon className="size-4" /></div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </div>
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
