import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, MapPin, Sparkles, Wrench, AlertTriangle } from 'lucide-react'
import { DashboardSkeleton } from '@/components/PageSkeleton'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { useRequireAdmin } from '../lib/admin'
import { apiAnalyticsSummary, apiHotspots, apiTrends } from '../lib/api'
import { fadeUp, stagger } from '../lib/motion'

type Hotspot = {
  geohash: string
  count: number
  recent: number
  lat: number
  lng: number
  severity: number
  score: number
  predictive?: boolean
  categories?: string[]
  risk_score?: number
}

type WardRow = { wardId: string; total: number; open: number; resolved: number }

function wardHeatColor(total: number, max: number): string {
  const ratio = max > 0 ? total / max : 0
  if (ratio >= 0.75) return 'bg-coral text-paper'
  if (ratio >= 0.5) return 'bg-coral/70 text-paper'
  if (ratio >= 0.25) return 'bg-coral/40 text-ink'
  return 'bg-indigo-soft text-indigo'
}

export function AdminAnalyticsPage() {
  const { user, loading, isAdmin, accessDenied, signInWithGoogle, signInWithDemo, signingIn } =
    useRequireAdmin('/dashboard', { redirect: false })
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [byCategory, setByCategory] = useState<Record<string, number>>({})
  const [wardBreakdown, setWardBreakdown] = useState<WardRow[]>([])
  const [narrative, setNarrative] = useState('')
  const [recurringIssues, setRecurringIssues] = useState<{ category: string; geohash6: string; count: number }[]>([])
  const [categoryTrends, setCategoryTrends] = useState<Record<string, { last7: number; last30: number; prev7: number }>>({})
  const [preventiveZones, setPreventiveZones] = useState<Hotspot[]>([])
  const [daily30, setDaily30] = useState<{ date: string; count: number }[]>([])
  const [slaBreached, setSlaBreached] = useState<number | null>(null)
  const [departmentSla, setDepartmentSla] = useState<{ departmentId: string; total: number; compliant: number; compliancePct: number | null }[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!user || !isAdmin) return
    setPageLoading(true)
    Promise.all([apiHotspots(), apiAnalyticsSummary(), apiTrends().catch(() => null)])
      .then(([h, s, t]) => {
        setHotspots(h.hotspots ?? [])
        setByCategory(s.byCategory ?? {})
        setWardBreakdown(s.wardBreakdown ?? t?.wardBreakdown ?? [])
        setNarrative(t?.narrative || s.insight || '')
        setRecurringIssues(t?.recurringIssues ?? [])
        setCategoryTrends(t?.categoryTrends ?? {})
        setSlaBreached(s.slaBreached ?? null)
        setDepartmentSla(s.departmentSla ?? [])
        setPreventiveZones((h.hotspots ?? []).filter((z) => z.predictive))
        setDaily30(t?.daily30 ?? [])
      })
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }, [user, isAdmin])

  const chartData = Object.entries(byCategory).map(([name, count]) => ({
    name: name.replace(/_/g, ' ').slice(0, 12),
    count,
  }))
  const maxWardTotal = wardBreakdown.reduce((m, w) => Math.max(m, w.total), 0)

  const categoryTrendRows = Object.entries(categoryTrends)
    .map(([category, t]) => ({ category, ...t, delta: t.last7 - t.prev7 }))
    .sort((a, b) => b.last7 - a.last7)

  const daily30Line = daily30.map((d) => ({ label: d.date.slice(5), count: d.count }))

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Admin analytics" subtitle="Loading…" />
        <DashboardSkeleton />
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Admin analytics" />
        <div className="space-y-3 px-5 py-16 text-center">
          <p className="mb-2 text-ink-muted">Admin sign-in required</p>
          <button
            type="button"
            className="mx-auto block w-full max-w-xs rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            {signingIn ? 'Signing in…' : 'Enter as demo authority'}
          </button>
          <button
            type="button"
            className="mx-auto block w-full max-w-xs rounded-2xl border border-rule px-8 py-3 text-sm font-bold text-ink"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
          >
            {signingIn ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        </div>
      </AppShell>
    )
  }

  if (!isAdmin || accessDenied) {
    return (
      <AppShell>
        <PageHeader title="Admin analytics" subtitle="Access denied" />
        <div className="space-y-3 px-5 py-16 text-center">
          <p className="text-ink-muted">Admin privileges required.</p>
          <button
            type="button"
            className="mx-auto block max-w-xs rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            {signingIn ? 'Signing in…' : 'Switch to demo authority'}
          </button>
          <Link to="/dashboard" className="block text-sm font-semibold text-coral">
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Admin analytics" subtitle="Hotspots · ward heatmap · trends" />
      {pageLoading ? (
        <DashboardSkeleton />
      ) : (
      <main className="space-y-6 px-5 pt-4 pb-10">
        {(slaBreached !== null || departmentSla.length > 0) && (
          <section>
            <SectionHeader title="SLA enforcement" hint="Open breaches · department compliance" />
            <div className="grid grid-cols-2 gap-3">
              {slaBreached !== null && (
                <GlassCard className="space-y-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    <AlertTriangle className="size-3.5 text-coral" /> Open SLA breaches
                  </p>
                  <p className={`display text-2xl font-bold ${slaBreached > 0 ? 'text-coral' : 'text-leaf'}`}>{slaBreached}</p>
                </GlassCard>
              )}
              {departmentSla.length > 0 && (
                <GlassCard className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Avg dept compliance</p>
                  <p className="display text-2xl font-bold text-ink">
                    {Math.round(
                      departmentSla.reduce((s, d) => s + (d.compliancePct ?? 0), 0) /
                        departmentSla.filter((d) => d.compliancePct !== null).length,
                    )}%
                  </p>
                </GlassCard>
              )}
            </div>
            {departmentSla.length > 0 && (
              <motion.ul variants={stagger} initial="hidden" animate="show" className="mt-3 space-y-2">
                {departmentSla.map((d) => (
                  <motion.li key={d.departmentId} variants={fadeUp}>
                    <GlassCard className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{d.departmentId}</p>
                        <p className="text-[11px] text-ink-muted">{d.compliant}/{d.total} resolved on time</p>
                      </div>
                      <span className="text-sm font-bold text-coral">{d.compliancePct ?? '—'}%</span>
                    </GlassCard>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </section>
        )}

        {narrative && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink p-5 text-paper">
              <div className="absolute -right-10 -top-10 size-48 rounded-full bg-coral/40 blur-3xl" />
              <div className="relative flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-coral" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-paper/70">Trend narrative</p>
                  <p className="display mt-1 text-sm font-semibold leading-snug">{narrative}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {wardBreakdown.length > 0 && (
          <section>
            <SectionHeader title="Ward heatmap" hint="Issue density by ward" />
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {wardBreakdown.map((w) => (
                <motion.li key={w.wardId} variants={fadeUp}>
                  <GlassCard className="flex items-center gap-3">
                    <div
                      className={`grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold ${wardHeatColor(w.total, maxWardTotal)}`}
                      title={`${w.total} total issues`}
                    >
                      {w.total}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{w.wardId}</p>
                      <div className="mt-1 flex gap-3 text-[11px] text-ink-muted">
                        <span>{w.open} open</span>
                        <span className="text-leaf">{w.resolved} resolved</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/5">
                        <div
                          className="h-full rounded-full bg-coral transition-all"
                          style={{ width: `${maxWardTotal > 0 ? (w.total / maxWardTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        )}

        {categoryTrendRows.length > 0 && (
          <section>
            <SectionHeader title="Category trends" hint="7d vs prior week" />
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {categoryTrendRows.map((row) => (
                <motion.li key={row.category} variants={fadeUp}>
                  <GlassCard className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{row.category.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-ink-muted">{row.last7} last 7d · {row.last30} last 30d</p>
                    </div>
                    <span className={`text-xs font-bold ${row.delta > 0 ? 'text-coral' : row.delta < 0 ? 'text-leaf' : 'text-ink-muted'}`}>
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </span>
                  </GlassCard>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        )}

        {daily30Line.length > 0 && (
          <section>
            <SectionHeader title="30-day volume" hint="Reports per day" />
            <GlassCard className="pt-5">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily30Line}>
                    <XAxis dataKey="label" stroke="oklch(0.48 0.03 265)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                    <Tooltip contentStyle={{ background: 'oklch(0.99 0.005 80)', borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="oklch(0.52 0.22 275)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </section>
        )}

        {preventiveZones.length > 0 && (
          <section>
            <SectionHeader title="Preventive zones" hint="High-risk clusters" />
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {preventiveZones.slice(0, 5).map((h) => (
                <motion.li key={h.geohash} variants={fadeUp}>
                  <GlassCard className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral">
                      <Wrench className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{h.geohash}</p>
                      <p className="text-[11px] text-ink-muted">
                        {h.count} open · {h.recent} recent · score {h.score} — schedule sweep
                      </p>
                    </div>
                  </GlassCard>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        )}

        {recurringIssues.length > 0 && (
          <section>
            <SectionHeader title="Recurring issues" hint="Same category + geohash (30d)" />
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {recurringIssues.map((r) => (
                <motion.li key={`${r.category}-${r.geohash6}`} variants={fadeUp}>
                  <GlassCard className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{r.category.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-ink-muted">{r.geohash6} · {r.count} reports</p>
                    </div>
                    <span className="rounded-lg bg-coral-soft px-2 py-1 text-[10px] font-bold uppercase text-coral">Recurring</span>
                  </GlassCard>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        )}

        <section>
          <SectionHeader title="Hotspot cells" hint="Predictive clusters" />
          {pageLoading ? (
            <div className="animate-pulse space-y-2" aria-busy="true" aria-label="Loading hotspots">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="paper h-16 rounded-2xl bg-ink/5" />
              ))}
            </div>
          ) : hotspots.length === 0 ? (
            <GlassCard><p className="text-sm text-ink-muted">No hotspot clusters detected yet.</p></GlassCard>
          ) : (
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {hotspots.map((h) => (
                <motion.li key={h.geohash} variants={fadeUp}>
                  <GlassCard className="flex items-center gap-3">
                    <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${h.predictive ? 'bg-coral-soft text-coral' : 'bg-indigo-soft text-indigo'}`}>
                      {h.predictive ? <Flame className="size-5" /> : <MapPin className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        {h.geohash}
                        {h.predictive && <span className="ml-2 text-[10px] font-bold uppercase text-coral">Predictive</span>}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {h.count} open · {h.recent} recent · severity {h.severity} · score {h.score}
                        {h.categories && h.categories.length > 0 && ` · ${h.categories.join(', ')}`}
                      </p>
                    </div>
                    <Link to={`/map`} className="text-xs font-bold text-coral">Map</Link>
                  </GlassCard>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        <section>
          <SectionHeader title="Category breakdown" hint="All reports" />
          <GlassCard className="pt-5">
            <div className="h-56">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <XAxis dataKey="name" stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                    <Tooltip
                      cursor={{ fill: 'oklch(0.66 0.21 36 / 0.08)' }}
                      contentStyle={{
                        background: 'oklch(0.99 0.005 80)',
                        border: '1px solid oklch(0.18 0.04 270 / 10%)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="oklch(0.52 0.22 275)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-ink-muted">No category data yet.</p>
              )}
            </div>
          </GlassCard>
        </section>

        <Link to="/admin" className="block text-center text-sm font-semibold text-coral">← Back to admin queue</Link>
      </main>
      )}
    </AppShell>
  )
}
