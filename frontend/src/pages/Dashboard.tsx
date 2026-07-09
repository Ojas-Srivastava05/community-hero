import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, Sparkles, TrendingUp, ArrowRight, Shield, Wrench } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { CivicMap } from '@/components/civic/CivicMap'
import { DashboardSkeleton } from '@/components/PageSkeleton'
import { useLocation } from '../lib/location'
import { useDashboardStore } from '../stores/useDashboardStore'
import { fadeUp, fadeUpChart, stagger } from '../lib/motion'

export function DashboardPage() {
  const { location } = useLocation()
  const { summary, hotspots, trends, loading, loadAll } = useDashboardStore()

  useEffect(() => {
    void loadAll()
  }, [location, loadAll])

  const categoryTrendRows = useMemo(
    () =>
      Object.entries(trends?.categoryTrends ?? {})
        .map(([category, t]) => ({
          category,
          ...t,
          delta: t.last7 - t.prev7,
        }))
        .sort((a, b) => b.last7 - a.last7)
        .slice(0, 6),
    [trends?.categoryTrends],
  )

  if (loading && !summary) {
    return (
      <AppShell>
        <PageHeader title="Civic dashboard" subtitle="Loading…" />
        <DashboardSkeleton />
      </AppShell>
    )
  }

  const avgHours = trends?.avgResolutionHours ?? summary?.avgResolutionHours
  const chartData = summary
    ? Object.entries(summary.byCategory).map(([name, count]) => ({ name: name.replace('_', ' ').slice(0, 10), count }))
    : []
  const trendLine = trends?.daily?.map((d) => ({
    label: d.date.slice(5),
    open: d.open,
    resolved: d.resolved,
  })) ?? []
  const daily30Line = trends?.daily30?.map((d) => ({ label: d.date.slice(5), count: d.count })) ?? []
  const reportsLine = summary?.reportsPerDay?.map((d) => ({ label: d.date.slice(5), count: d.count })) ?? []
  const upvotesLine = summary?.upvotesPerDay?.map((d) => ({ label: d.date.slice(5), count: d.count })) ?? []
  const preventiveZones = trends?.preventiveZones ?? hotspots.filter((h) => h.predictive)
  const mapHotspots = hotspots
    .filter((h) => h.lat && h.lng)
    .map((h) => ({
      geohash: h.geohash,
      lat: h.lat!,
      lng: h.lng!,
      count: h.count,
      score: h.score,
      predictive: h.predictive,
    }))
  const mapCenter = location
    ? { lat: location.lat, lng: location.lng }
    : mapHotspots[0]
      ? { lat: mapHotspots[0].lat, lng: mapHotspots[0].lng }
      : { lat: 20, lng: 0 }
  const overallSla =
    summary?.departmentSla && summary.departmentSla.length > 0
      ? Math.round(
          summary.departmentSla.reduce((s, d) => s + (d.compliancePct ?? 0), 0) /
            summary.departmentSla.filter((d) => d.compliancePct !== null).length,
        )
      : null

  return (
    <AppShell>
      <PageHeader
        title="Civic dashboard"
        subtitle={location ? `${location.label} · live` : 'Live data'}
        right={
          <div className="flex items-center gap-3">
            <Link to="/scorecards" className="text-xs font-bold text-ink-muted">Scorecards</Link>
            <Link to="/assistant" className="text-xs font-bold text-coral">Ask AI</Link>
          </div>
        }
      />
      <motion.section variants={stagger} initial="hidden" animate="show" className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Total" value={String(summary?.total ?? '—')} delta="live" />
          <Kpi label="Open" value={String(summary?.open ?? '—')} delta="active" />
          <Kpi label="Resolved" value={String(summary?.resolved ?? '—')} delta="done" good />
          <Kpi label="Avg resolve" value={avgHours ? `${Math.round(avgHours)}h` : '—'} delta="SLA" good />
          <Kpi
            label="SLA breaches"
            value={String(summary?.slaBreached ?? '—')}
            delta="open past deadline"
            good={summary?.slaBreached === 0}
          />
        </div>
        {overallSla !== null && !Number.isNaN(overallSla) && (
          <motion.div variants={fadeUp} className="mt-3 paper flex items-center gap-3 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-leaf/15 text-leaf">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink-muted">Dept SLA compliance</p>
              <p className="display text-xl font-bold text-ink">{overallSla}%</p>
            </div>
          </motion.div>
        )}
      </motion.section>

      {summary?.departmentSla && summary.departmentSla.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Department SLA" hint="Resolved before deadline" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Resolved</th>
                  <th className="px-4 py-3 font-semibold">On time</th>
                  <th className="px-4 py-3 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {summary.departmentSla.map((d) => (
                  <tr key={d.departmentId} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-ink">{d.departmentId}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{d.total}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{d.compliant}</td>
                    <td className="px-4 py-2.5 font-bold text-leaf">{d.compliancePct ?? '—'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
          </motion.div>
        </motion.section>
      )}

      {summary?.wardBreakdown && summary.wardBreakdown.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Ward breakdown" hint="By wardId" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Ward</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Open</th>
                  <th className="px-4 py-3 font-semibold">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {summary.wardBreakdown.map((w) => (
                  <tr key={w.wardId} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-ink">{w.wardId}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{w.total}</td>
                    <td className="px-4 py-2.5 text-coral">{w.open}</td>
                    <td className="px-4 py-2.5 text-leaf">{w.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
          </motion.div>
        </motion.section>
      )}

      {(reportsLine.length > 0 || upvotesLine.length > 0) && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Citizen engagement" hint="Reports & upvotes per day" />
          </motion.div>
          <motion.div variants={fadeUpChart} className="grid gap-3">
            {reportsLine.length > 0 && (
              <GlassCard className="pt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Reports / day</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportsLine}>
                      <XAxis dataKey="label" stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: 'oklch(0.99 0.005 80)', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="oklch(0.66 0.21 36)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
            {upvotesLine.length > 0 && (
              <GlassCard className="pt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Upvotes / day</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={upvotesLine}>
                      <XAxis dataKey="label" stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: 'oklch(0.99 0.005 80)', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="oklch(0.52 0.22 275)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </motion.section>
      )}

      {mapHotspots.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Hotspot map" hint="Predictive clusters" action={<Link to="/map">Explorer</Link>} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <GlassCard className="overflow-hidden p-0">
            <div className="h-48">
              <CivicMap center={mapCenter} issues={[]} hotspots={mapHotspots} zoom={13} className="size-full" />
            </div>
          </GlassCard>
          </motion.div>
        </motion.section>
      )}

      {categoryTrendRows.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Category momentum" hint="7d vs prior week" />
          </motion.div>
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {categoryTrendRows.map((row) => (
              <motion.li key={row.category} variants={fadeUp}>
                <GlassCard className="flex items-center justify-between gap-3 py-3">
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
        </motion.section>
      )}

      {daily30Line.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="30-day volume" hint="Reports per day" />
          </motion.div>
          <motion.div variants={fadeUpChart}>
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
          </motion.div>
        </motion.section>
      )}

      {preventiveZones.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Preventive maintenance" hint="High-risk zones" action={<Wrench className="size-4 text-coral" />} />
          </motion.div>
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {preventiveZones.slice(0, 5).map((h) => (
              <motion.li key={h.geohash} variants={fadeUp}>
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-coral-soft text-coral">
                    <Wrench className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{h.geohash}</p>
                    <p className="text-[11px] text-ink-muted">{h.count} open · score {h.score} — schedule sweep</p>
                  </div>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {hotspots.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="Hotspot cells" hint="Predictive clusters" action={<Link to="/admin/analytics">Analytics</Link>} />
          </motion.div>
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {hotspots.slice(0, 5).map((h) => (
              <motion.li key={h.geohash} variants={fadeUp}>
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className={`grid size-9 place-items-center rounded-lg ${h.predictive ? 'bg-coral-soft text-coral' : 'bg-indigo-soft text-indigo'}`}>
                    <Flame className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">
                      {h.geohash}
                      {h.predictive && <span className="ml-2 text-[10px] font-bold uppercase text-coral">Alert</span>}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {h.count} open · {h.recent} recent · score {h.score}
                      {h.categories && h.categories.length > 0 ? ` · ${h.categories.join(', ')}` : ''}
                    </p>
                  </div>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {trendLine.length > 0 && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
            <SectionHeader title="7-day trend" hint="Open vs resolved" />
          </motion.div>
          <motion.div variants={fadeUpChart}>
            <GlassCard className="pt-5">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendLine}>
                  <XAxis dataKey="label" stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.48 0.03 265)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.99 0.005 80)',
                      border: '1px solid oklch(0.18 0.04 270 / 10%)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="open" stroke="oklch(0.66 0.21 36)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="oklch(0.58 0.16 150)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
          </motion.div>
        </motion.section>
      )}

      <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
        <motion.div variants={fadeUp}>
          <SectionHeader title="By category" hint="All reports" />
        </motion.div>
        <motion.div variants={fadeUpChart}>
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
                      color: 'oklch(0.18 0.04 270)',
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.66 0.21 36)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-sm text-ink-muted">No category data yet.</p>
            )}
          </div>
        </GlassCard>
        </motion.div>
      </motion.section>
      {(summary?.insight || trends?.narrative || trends?.seasonalWasteSpike) && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 px-5">
          <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink p-5 text-paper">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-coral/40 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-coral/20 ring-1 ring-coral/40"><Sparkles className="size-5 text-coral" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-paper/70">AI insight</p>
                <p className="display mt-1 text-sm font-semibold leading-snug">{trends?.narrative || summary?.insight}</p>
                {trends?.seasonalWasteSpike?.message && (
                  <p className="mt-2 text-xs font-medium text-coral">{trends.seasonalWasteSpike.message}</p>
                )}
                <Link to="/admin/analytics" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-coral">
                  View analytics <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
          </motion.div>
        </motion.section>
      )}
    </AppShell>
  )
}

function Kpi({ label, value, delta, good }: { label: string; value: string; delta: string; good?: boolean }) {
  return (
    <motion.div variants={fadeUp} className="paper p-4">
      <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
      <p className="display mt-1 text-2xl font-bold text-ink">{value}</p>
      <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${good ? 'text-leaf' : 'text-coral'}`}>
        <TrendingUp className="size-3" /> {delta}
      </div>
    </motion.div>
  )
}
