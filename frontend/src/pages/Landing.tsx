import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bell, Loader2, MapPin, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader, Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { apiAnalyticsSummary, apiListIssues } from '../lib/api'
import { useLocation } from '../lib/location'
import { sortByDistance } from '../lib/geo'
import {
  apiSeverityToUi,
  categoryLabel,
  issueArea,
  issueImage,
  issueReportedAt,
} from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

const HERO_IMG = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80'

export function LandingPage() {
  const { location, loading: locLoading, error: locError } = useLocation()
  const [stats, setStats] = useState({ open: 0, resolved: 0, total: 0, avgHours: 36 })
  const [trending, setTrending] = useState<Issue[]>([])
  const [recent, setRecent] = useState<Issue[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const opts =
      location ? { lat: location.lat, lng: location.lng, radiusKm: 25 } : undefined
    setDataLoading(true)
    Promise.all([apiAnalyticsSummary(), apiListIssues(50, opts)])
      .then(([s, list]) => {
        setStats({
          open: s.open ?? 0,
          resolved: s.resolved ?? 0,
          total: s.total ?? 0,
          avgHours: Math.round(s.avgResolutionHours ?? 36),
        })
        let issues = list.issues
        if (location) {
          issues = sortByDistance(issues, location.lat, location.lng, 25)
        }
        const sorted = [...issues].sort((a, b) => b.upvoteCount - a.upvoteCount)
        setTrending(sorted.slice(0, 4))
        setRecent(issues.slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setDataLoading(false))
  }, [location])

  const areaLabel = location?.label || (locLoading ? 'Finding your area…' : 'Near you')
  const cityLabel = location?.city || 'Your city'

  return (
    <AppShell>
      <section className="relative px-5 pb-6 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-teal/15 ring-1 ring-teal/30">
              <ShieldCheck className="size-5 text-teal" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CivicPulse · {cityLabel}
              </p>
              <p className="text-sm font-bold">Community Hero</p>
            </div>
          </div>
          <Link to="/activity" className="grid size-9 place-items-center rounded-xl border border-glass-border bg-glass">
            <Bell className="size-4" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mt-5 overflow-hidden rounded-3xl border border-glass-border"
        >
          <img src={HERO_IMG} alt={cityLabel} className="absolute inset-0 size-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="relative p-6 pt-32">
            <Chip tone="teal">
              {locLoading ? (
                <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Locating…</span>
              ) : (
                <><MapPin className="size-3" /> {areaLabel}</>
              )}
            </Chip>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              Your city,
              <br />
              <span className="text-gradient-teal">your move.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {dataLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Loading issues…</span>
              ) : (
                `${stats.total} issues tracked · ${stats.resolved} resolved`
              )}
            </p>
            {locError && <p className="mt-1 text-xs text-sev-med">Location unavailable — showing all issues</p>}
            <Link
              to="/report"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-primary-foreground teal-glow"
            >
              Report something
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-5">
        <SectionHeader title="Live pulse" hint="Updated from Firestore" />
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="col-span-2 row-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Open issues</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-teal">{dataLoading ? '—' : stats.open}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-sev-low">
              <TrendingUp className="size-3.5" /> Near {areaLabel}
            </div>
            <div className="mt-4 flex h-14 items-end gap-1">
              {[18, 24, 21, 30, 28, 36, 44].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-teal/40" style={{ height: `${h * 1.4}%` }} />
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <p className="text-[11px] font-semibold text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-extrabold">{dataLoading ? '—' : stats.total}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-[11px] font-semibold text-muted-foreground">Avg resolve</p>
            <p className="mt-1 text-xl font-extrabold">{stats.avgHours}h</p>
          </GlassCard>
        </div>
      </section>

      <section className="mt-6">
        <div className="px-5">
          <SectionHeader title="Trending nearby" hint={areaLabel} action={<Link to="/map">See map →</Link>} />
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {trending.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-glass-border"
            >
              <img src={issueImage(issue)} alt="" className="aspect-[5/4] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
                <h3 className="mt-2 text-sm font-bold leading-tight">{issue.title}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {issueArea(issue)} · {issue.upvoteCount} upvotes
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionHeader title="Recent near you" action={<Link to="/activity">All →</Link>} />
        <div className="space-y-2">
          {recent.map((i) => (
            <Link key={i.id} to={`/issues/${i.id}`} className="glass grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3">
              <img src={issueImage(i)} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{i.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {categoryLabel(i.category)} · {issueReportedAt(i)}
                </p>
              </div>
              <SeverityBadge severity={apiSeverityToUi(i.severity)} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5 pb-4">
        <Link to="/assistant" className="relative block overflow-hidden rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/15 via-glass to-glass p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal/20 ring-1 ring-teal/40">
              <Sparkles className="size-5 text-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Ask Civic AI</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Which issues are near me? How do I report?</p>
            </div>
          </div>
        </Link>
      </section>
    </AppShell>
  )
}
