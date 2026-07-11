import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bell, Flame, Loader2, MapPin, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionHeader } from '@/components/civic/GlassCard'
import { LiveIndicator } from '@/components/civic/LiveIndicator'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { apiAnalyticsSummary, apiHotspots } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAdminMode } from '../lib/admin-mode'
import { useI18n } from '../lib/i18n'
import { useLocation } from '../lib/location'
import { useLiveIssues } from '../lib/use-live-issues'
import { sortByDistance } from '../lib/geo'
import { fadeUp, stagger } from '../lib/motion'
import {
  apiSeverityToUi,
  categoryLabel,
  issueArea,
  issueImage,
  issueReportedAt,
} from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

function useTicker(value: number, enabled: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - (1 - p) ** 3
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, enabled])
  return enabled ? n : 0
}

export function LandingPage() {
  const { user } = useAuth()
  const { isAdmin, checking } = useAdminMode()
  const { t } = useI18n()
  const { location, loading: locLoading, error: locError } = useLocation()
  const { issues: liveIssues, loading: issuesLoading, livePulse } = useLiveIssues({
    lat: location?.lat,
    lng: location?.lng,
    radiusKm: location ? 25 : undefined,
    fetchLimit: 50,
  })
  const [stats, setStats] = useState({ open: 0, resolved: 0, total: 0, avgHours: 36 })
  const [trending, setTrending] = useState<Issue[]>([])
  const [recent, setRecent] = useState<Issue[]>([])
  const [predictiveHotspots, setPredictiveHotspots] = useState<{ geohash: string; count: number; score: number }[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    setStatsLoading(true)
    Promise.all([apiAnalyticsSummary(), apiHotspots().catch(() => ({ hotspots: [] }))])
      .then(([s, hotspots]) => {
        setStats({
          open: s.open ?? 0,
          resolved: s.resolved ?? 0,
          total: s.total ?? 0,
          avgHours: Math.round(s.avgResolutionHours ?? 36),
        })
        setPredictiveHotspots((hotspots.hotspots ?? []).filter((h) => h.predictive).slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => {
    let issues = liveIssues
    if (location) {
      issues = sortByDistance(issues, location.lat, location.lng, 25)
    }
    const sorted = [...issues].sort((a, b) => b.upvoteCount - a.upvoteCount)
    setTrending(sorted.slice(0, 4))
    setRecent(issues.slice(0, 4))
  }, [liveIssues, location])

  const dataLoading = statsLoading || issuesLoading

  const areaLabel = location?.label || (locLoading ? 'Finding your area…' : 'Near you')
  const cityLabel = location?.city || 'Your city'
  const openCount = useTicker(stats.open, !dataLoading)
  const resolvedCount = useTicker(stats.resolved, !dataLoading)
  const totalCount = useTicker(stats.total, !dataLoading)

  if (user && checking) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      </AppShell>
    )
  }
  if (user && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <AppShell>
      <section className="relative px-5 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <span className="size-2 rounded-full bg-leaf animate-pulse" />
              Community Hero · {cityLabel}
              <LiveIndicator active={livePulse} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink">
              <MapPin className="size-4 text-coral" />
              {locLoading ? 'Locating…' : areaLabel}
            </div>
          </motion.div>
          <div className="flex items-center gap-2">
            {!user && (
              <motion.div whileTap={{ scale: 0.92 }}>
                <Link
                  to="/report"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf-soft px-3 text-xs font-bold text-leaf"
                >
                  <ShieldCheck className="size-3.5" /> {t('feature.noLogin.badge')}
                </Link>
              </motion.div>
            )}
            <motion.div whileTap={{ scale: 0.92 }}>
              <Link
                to="/activity"
                className="relative grid size-10 place-items-center rounded-full border border-rule bg-paper"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="display mt-5 text-[40px] leading-[1.02] font-bold text-ink"
        >
          A city <em className="text-gradient-coral not-italic">that listens</em>,
          <br /> when you speak.
        </motion.h1>
        <p className="mt-3 max-w-[34ch] text-sm text-ink-muted">
          Snap a civic issue. AI files the report, routes it to the right department, and your neighbours boost it.
        </p>
        {!user && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-leaf">
            <ShieldCheck className="size-3.5" />
            {t('feature.noLogin.hint')}
          </p>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show" className="mt-5 flex flex-wrap gap-2">
          <motion.div variants={fadeUp}>
            <Link
              to="/report"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-coral px-5 text-sm font-bold text-paper ink-glow active:scale-95 transition-transform"
            >
              <Sparkles className="size-4" /> {t('feature.noLogin.cta')}
            </Link>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              to="/map"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 text-sm font-bold text-ink active:scale-95 transition-transform"
            >
              <MapPin className="size-4" /> Explore map
            </Link>
          </motion.div>
        </motion.div>
        {locError && <p className="mt-2 text-xs text-amber">Location unavailable — showing all issues</p>}
      </section>

      <section className="px-5 pb-2">
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-2">
          <StatTile tone="coral" label="Open" value={dataLoading ? '—' : openCount} hint="near you" />
          <StatTile tone="leaf" label="Resolved" value={dataLoading ? '—' : resolvedCount} hint="all time" />
          <StatTile tone="indigo" label="Total" value={dataLoading ? '—' : totalCount} hint={`${stats.avgHours}h avg`} />
        </motion.div>
      </section>

      {predictiveHotspots.length > 0 && (
        <section className="px-5 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[28px] border border-coral/30 bg-coral-soft/40 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral text-paper">
                <Flame className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-coral">Hotspot alert</p>
                <p className="display mt-1 text-sm font-semibold text-ink">
                  {predictiveHotspots.length} predictive cluster{predictiveHotspots.length > 1 ? 's' : ''} near you — elevated issue density detected.
                </p>
                <ul className="mt-2 space-y-1">
                  {predictiveHotspots.map((h) => (
                    <li key={h.geohash} className="text-[11px] font-semibold text-ink-muted">
                      Cell {h.geohash} · {h.count} issues · score {h.score}
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-coral">
                  View dashboard <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      <section className="px-5 pt-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink p-5 text-paper"
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-coral/40 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-indigo/40 blur-3xl" />
          <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/70">
            <Sparkles className="size-3.5 text-coral" /> Civic AI · Today&apos;s pulse
          </div>
          <p className="display relative mt-2 text-2xl font-semibold leading-snug">
            {dataLoading ? (
              <span className="flex items-center gap-2 text-lg"><Loader2 className="size-4 animate-spin" /> Loading insights…</span>
            ) : (
              <>
                {stats.open} open issues{location ? ` in ${areaLabel}` : ''}.{' '}
                <span className="text-coral">{stats.resolved}</span> resolved so far.
              </>
            )}
          </p>
          <Link to="/assistant" className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-paper">
            Ask the assistant <ArrowUpRight className="size-4" />
          </Link>
        </motion.div>
      </section>

      <section className="px-5 pt-7">
        <SectionHeader
          title="Trending nearby"
          hint={areaLabel}
          action={<Link to="/map">See all</Link>}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1"
        >
          {trending.map((issue) => (
            <motion.div key={issue.id} variants={fadeUp} className="w-[78%] shrink-0 snap-start">
              <Link to={`/issues/${issue.id}`} className="block">
                <div className="paper overflow-hidden p-0">
                  <div className="relative h-36 overflow-hidden bg-surface">
                    <img
                      src={issueImage(issue)}
                      alt={`${issue.title} — civic issue photo`}
                      className="size-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute left-3 top-3">
                      <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
                    </div>
                    <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-paper/95 px-2 py-1 text-[11px] font-bold text-ink">
                      <Zap className="size-3 text-coral" /> {issue.upvoteCount}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      {categoryLabel(issue.category)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{issue.title}</div>
                    <div className="mt-2">
                      <VerificationBadges
                        upvoteCount={issue.upvoteCount}
                        verificationLevel={issue.verificationLevel}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {!dataLoading && trending.length === 0 && (
            <p className="px-2 py-8 text-sm text-ink-muted">No issues nearby yet — be the first to report.</p>
          )}
        </motion.div>
      </section>

      <section className="px-5 pt-7 pb-4">
        <SectionHeader title="Recent activity" hint={areaLabel} action={<Link to="/activity">Open</Link>} />
        <motion.ul
          variants={stagger}
          initial="hidden"
          animate="show"
          className="paper divide-y divide-rule overflow-hidden"
        >
          {recent.map((issue) => (
            <motion.li key={issue.id} variants={fadeUp}>
              <Link to={`/issues/${issue.id}`} className="flex items-start gap-3 px-4 py-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-soft text-indigo">
                  <TrendingUp className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-bold">Community</span>{' '}
                    <span className="text-ink-muted">reported</span>{' '}
                    <span className="font-semibold text-coral">{issue.title}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold text-ink-muted">
                      {issueArea(issue)} · {issueReportedAt(issue)}
                    </p>
                    <VerificationBadges
                      upvoteCount={issue.upvoteCount}
                      verificationLevel={issue.verificationLevel}
                      compact
                    />
                  </div>
                </div>
                <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-6 grid grid-cols-2 gap-2 pb-4"
        >
          <BentoLink to="/dashboard" tone="leaf" label="Impact" sub="Charts & insight" />
          <BentoLink to="/leaderboard" tone="amber" label="Leaderboard" sub="Civic points" />
          <BentoLink to="/scorecards" tone="indigo" label="Scorecards" sub="Dept grades A–D" />
          <BentoLink to="/assistant" tone="coral" label="Ask AI" sub="Civic assistant" />
        </motion.div>
      </section>
    </AppShell>
  )
}

function StatTile({
  tone,
  label,
  value,
  hint,
}: {
  tone: 'coral' | 'leaf' | 'indigo'
  label: string
  value: number | string
  hint: string
}) {
  const toneBg = { coral: 'bg-coral-soft', leaf: 'bg-leaf-soft', indigo: 'bg-indigo-soft' }[tone]
  const toneText = { coral: 'text-coral', leaf: 'text-leaf', indigo: 'text-indigo' }[tone]
  return (
    <motion.div variants={fadeUp} className={`paper p-3 ${toneBg}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.12em] ${toneText}`}>{label}</div>
      <div className="display mt-1 text-2xl font-bold text-ink">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <div className="text-[10px] font-semibold text-ink-muted">{hint}</div>
    </motion.div>
  )
}

function BentoLink({
  to,
  tone,
  label,
  sub,
}: {
  to: string
  tone: 'coral' | 'leaf' | 'indigo' | 'amber'
  label: string
  sub: string
}) {
  const bg = {
    coral: 'bg-coral text-paper',
    leaf: 'bg-leaf text-paper',
    indigo: 'bg-indigo text-paper',
    amber: 'bg-amber text-ink',
  }[tone]
  return (
    <motion.div variants={fadeUp} whileTap={{ scale: 0.97 }}>
      <Link
        to={to}
        className={`relative flex h-24 flex-col justify-between overflow-hidden rounded-[22px] p-3 ${bg}`}
      >
        <ArrowUpRight className="size-4 self-end opacity-80" />
        <div>
          <div className="display text-lg font-bold leading-none">{label}</div>
          <div className="mt-1 text-[11px] font-semibold opacity-80">{sub}</div>
        </div>
      </Link>
    </motion.div>
  )
}
