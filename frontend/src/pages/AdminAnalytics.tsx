import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Flame, MapPin, Sparkles, Wrench } from 'lucide-react'
import { DashboardSkeleton } from '@/components/PageSkeleton'
import { AdminShell } from '@/components/layout/AdminShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { useRequireAdmin } from '../lib/admin'
import { useAdminMode } from '../lib/admin-mode'
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

function avgCompliance(
  rows: { compliancePct: number | null }[],
): number | null {
  const valid = rows.filter((d) => d.compliancePct !== null)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((s, d) => s + (d.compliancePct ?? 0), 0) / valid.length)
}

export function AdminAnalyticsPage() {
  const { user, loading, isAdmin, accessDenied, signInWithGoogle, signInWithDemo, signingIn } =
    useRequireAdmin('/dashboard', { redirect: false })
  const { checking: adminChecking } = useAdminMode()
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(0)
  const [resolved, setResolved] = useState(0)
  const [byCategory, setByCategory] = useState<Record<string, number>>({})
  const [wardBreakdown, setWardBreakdown] = useState<WardRow[]>([])
  const [narrative, setNarrative] = useState('')
  const [categoryTrends, setCategoryTrends] = useState<Record<string, { last7: number; last30: number; prev7: number }>>({})
  const [preventiveZones, setPreventiveZones] = useState<Hotspot[]>([])
  const [daily30, setDaily30] = useState<{ date: string; count: number }[]>([])
  const [slaBreached, setSlaBreached] = useState(0)
  const [departmentSla, setDepartmentSla] = useState<
    { departmentId: string; total: number; compliant: number; compliancePct: number | null }[]
  >([])
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  const authReady = !loading && !adminChecking

  useEffect(() => {
    if (!authReady || !user || !isAdmin) return
    let cancelled = false
    setPageLoading(true)
    setLoadError(null)
    Promise.all([apiHotspots(), apiAnalyticsSummary(), apiTrends().catch(() => null)])
      .then(([h, s, t]) => {
        if (cancelled) return
        setHotspots(h.hotspots ?? [])
        setTotal(s.total ?? 0)
        setOpen(s.open ?? 0)
        setResolved(s.resolved ?? 0)
        setByCategory(s.byCategory ?? {})
        setWardBreakdown(s.wardBreakdown ?? t?.wardBreakdown ?? [])
        setNarrative(t?.narrative || s.insight || '')
        setCategoryTrends(t?.categoryTrends ?? {})
        setSlaBreached(s.slaBreached ?? 0)
        setDepartmentSla(s.departmentSla ?? [])
        setPreventiveZones((h.hotspots ?? []).filter((z) => z.predictive))
        setDaily30(t?.daily30 ?? [])
        setDataLoaded(true)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load analytics')
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authReady, user, isAdmin])

  const chartData = Object.entries(byCategory).map(([name, count]) => ({
    name: name.replace(/_/g, ' ').slice(0, 12),
    count,
  }))
  const maxWardTotal = wardBreakdown.reduce((m, w) => Math.max(m, w.total), 0)
  const deptAvg = useMemo(() => avgCompliance(departmentSla), [departmentSla])

  const categoryTrendRows = Object.entries(categoryTrends)
    .map(([category, t]) => ({ category, ...t, delta: t.last7 - t.prev7 }))
    .sort((a, b) => b.last7 - a.last7)

  const daily30Line = daily30.map((d) => ({ label: d.date.slice(5), count: d.count }))

  if (loading || adminChecking) {
    return (
      <AdminShell title="Analytics" subtitle="Loading…">
        <DashboardSkeleton />
      </AdminShell>
    )
  }

  if (!user) {
    return (
      <AdminShell title="Analytics">
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">Authority sign-in required.</p>
          <button
            type="button"
            className="w-full rounded-2xl bg-indigo py-4 text-sm font-bold text-paper"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            {signingIn ? 'Signing in…' : 'Enter as demo authority'}
          </button>
          <button
            type="button"
            className="w-full rounded-2xl border border-rule py-3 text-sm font-bold text-ink"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
          >
            Sign in with Google
          </button>
        </div>
      </AdminShell>
    )
  }

  if (!isAdmin || accessDenied) {
    return (
      <AdminShell title="Access denied">
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">Admin privileges required.</p>
          <button
            type="button"
            className="rounded-2xl bg-indigo px-8 py-3 text-sm font-bold text-paper"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            Switch to demo authority
          </button>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Analytics" subtitle={`${total} reports · ${open} open · ${slaBreached} SLA breach`}>
      {loadError && (
        <GlassCard className="mb-4 border border-coral/30 bg-coral-soft/30 text-sm text-coral">
          {loadError}. Pull to refresh or check network.
        </GlassCard>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <GlassCard className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Total reports</p>
          <p className="display text-2xl font-bold text-ink">{pageLoading ? '—' : total}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Open now</p>
          <p className="display text-2xl font-bold text-indigo">{pageLoading ? '—' : open}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Resolved</p>
          <p className="display text-2xl font-bold text-leaf">{pageLoading ? '—' : resolved}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <AlertTriangle className="size-3 text-coral" /> SLA breach
          </p>
          <p className={`display text-2xl font-bold ${slaBreached > 0 ? 'text-coral' : 'text-leaf'}`}>
            {pageLoading ? '—' : slaBreached}
          </p>
        </GlassCard>
      </div>

      {pageLoading || !dataLoaded ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {narrative && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink p-5 text-paper">
                <div className="absolute -right-10 -top-10 size-48 rounded-full bg-indigo/40 blur-3xl" />
                <div className="relative flex items-start gap-3">
                  <Sparkles className="size-5 shrink-0 text-indigo-soft" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-paper/70">AI summary</p>
                    <p className="display mt-1 text-sm font-semibold leading-snug">{narrative}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {deptAvg !== null && (
            <section>
              <SectionHeader title="Department SLA" hint="On-time resolution rate" />
              <GlassCard className="mb-3">
                <p className="text-[11px] text-ink-muted">Average compliance</p>
                <p className="display text-2xl font-bold text-ink">{deptAvg}%</p>
              </GlassCard>
              <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
                {departmentSla.map((d) => (
                  <motion.li key={d.departmentId} variants={fadeUp}>
                    <GlassCard className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{d.departmentId}</p>
                        <p className="text-[11px] text-ink-muted">
                          {d.compliant}/{d.total} on time
                        </p>
                      </div>
                      <span className="text-sm font-bold text-coral">{d.compliancePct ?? '—'}%</span>
                    </GlassCard>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}

          <section>
            <SectionHeader title="Ward heatmap" hint={wardBreakdown.length ? 'Issue density by ward' : 'No ward data yet'} />
            {wardBreakdown.length === 0 ? (
              <GlassCard className="text-sm text-ink-muted">Ward breakdown will appear once issues have ward IDs.</GlassCard>
            ) : (
              <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
                {wardBreakdown.slice(0, 12).map((w) => (
                  <motion.li key={w.wardId} variants={fadeUp}>
                    <GlassCard className="flex items-center gap-3">
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold ${wardHeatColor(w.total, maxWardTotal)}`}
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
            )}
          </section>

          {categoryTrendRows.length > 0 && (
            <section>
              <SectionHeader title="Category trends" hint="7d vs prior week" />
              <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
                {categoryTrendRows.slice(0, 8).map((row) => (
                  <motion.li key={row.category} variants={fadeUp}>
                    <GlassCard className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{row.category.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-ink-muted">
                          {row.last7} last 7d · {row.last30} last 30d
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold ${row.delta > 0 ? 'text-coral' : row.delta < 0 ? 'text-leaf' : 'text-ink-muted'}`}
                      >
                        {row.delta > 0 ? `+${row.delta}` : row.delta}
                      </span>
                    </GlassCard>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}

          <section>
            <SectionHeader title="30-day volume" hint="Reports per day" />
            <GlassCard className="pt-5">
              <div className="h-48 min-h-[12rem] w-full">
                {daily30Line.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily30Line}>
                      <XAxis dataKey="label" stroke="oklch(0.48 0.03 265)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: 'oklch(0.99 0.005 80)', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="oklch(0.52 0.22 275)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-ink-muted">Not enough history for a trend line yet.</p>
                )}
              </div>
            </GlassCard>
          </section>

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
                          {h.count} open · {h.recent} recent · score {h.score}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}

          <section>
            <SectionHeader title="Hotspot cells" hint={`${hotspots.length} clusters`} />
            {hotspots.length === 0 ? (
              <GlassCard className="text-sm text-ink-muted">No hotspot clusters detected yet.</GlassCard>
            ) : (
              <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
                {hotspots.map((h) => (
                  <motion.li key={h.geohash} variants={fadeUp}>
                    <GlassCard className="flex items-center gap-3">
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${h.predictive ? 'bg-coral-soft text-coral' : 'bg-indigo-soft text-indigo'}`}
                      >
                        {h.predictive ? <Flame className="size-5" /> : <MapPin className="size-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">
                          {h.geohash}
                          {h.predictive && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-coral">Predictive</span>
                          )}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {h.count} open · {h.recent} recent · severity {h.severity}
                        </p>
                      </div>
                      <Link to="/map" className="text-xs font-bold text-indigo">
                        Map
                      </Link>
                    </GlassCard>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </section>

          <section>
            <SectionHeader title="By category" hint="All reports" />
            <GlassCard className="pt-5">
              <div className="h-56 min-h-[14rem] w-full">
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
                  <p className="py-8 text-center text-sm text-ink-muted">No category data yet.</p>
                )}
              </div>
            </GlassCard>
          </section>
        </div>
      )}
    </AdminShell>
  )
}
