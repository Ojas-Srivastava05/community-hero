import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { apiAnalyticsSummary, apiHotspots, apiTrends } from '../lib/api'
import { useLocation } from '../lib/location'
import { fadeUp, stagger } from '../lib/motion'

type Hotspot = {
  geohash: string
  count: number
  recent: number
  score: number
  predictive?: boolean
}

export function DashboardPage() {
  const { location } = useLocation()
  const [summary, setSummary] = useState<{
    total: number
    open: number
    resolved: number
    byCategory: Record<string, number>
    insight?: string
    avgResolutionHours?: number
  } | null>(null)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [trends, setTrends] = useState<{
    narrative?: string
    avgResolutionHours?: number
    daily?: { date: string; open: number; resolved: number }[]
  } | null>(null)

  useEffect(() => {
    Promise.all([
      apiAnalyticsSummary(),
      apiHotspots().catch(() => ({ hotspots: [] })),
      apiTrends().catch(() => null),
    ])
      .then(([s, h, t]) => {
        setSummary(s)
        setHotspots(h.hotspots ?? [])
        setTrends(t)
      })
      .catch(() => {})
  }, [location])

  const avgHours = trends?.avgResolutionHours ?? summary?.avgResolutionHours
  const chartData = summary
    ? Object.entries(summary.byCategory).map(([name, count]) => ({ name: name.replace('_', ' ').slice(0, 10), count }))
    : []
  const trendLine = trends?.daily?.map((d) => ({
    label: d.date.slice(5),
    open: d.open,
    resolved: d.resolved,
  })) ?? []

  return (
    <AppShell>
      <PageHeader
        title="Civic dashboard"
        subtitle={location ? `${location.label} · live` : 'Live data'}
        right={<Link to="/admin/analytics" className="text-xs font-bold text-coral">Deep dive</Link>}
      />
      <motion.section variants={stagger} initial="hidden" animate="show" className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Total" value={String(summary?.total ?? '—')} delta="live" />
          <Kpi label="Open" value={String(summary?.open ?? '—')} delta="active" />
          <Kpi label="Resolved" value={String(summary?.resolved ?? '—')} delta="done" good />
          <Kpi label="Avg resolve" value={avgHours ? `${Math.round(avgHours)}h` : '—'} delta="SLA" good />
        </div>
      </motion.section>

      {hotspots.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 px-5"
        >
          <SectionHeader title="Hotspot cells" hint="Predictive clusters" action={<Link to="/admin/analytics">Analytics</Link>} />
          <motion.ul variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-2">
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
                    <p className="text-[11px] text-ink-muted">{h.count} open · {h.recent} recent · score {h.score}</p>
                  </div>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}

      {trendLine.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 px-5"
        >
          <SectionHeader title="7-day trend" hint="Open vs resolved" />
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
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-6 px-5"
      >
        <SectionHeader title="By category" hint="All reports" />
        <GlassCard className="pt-5">
          <div className="h-56">
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
          </div>
        </GlassCard>
      </motion.section>
      {(summary?.insight || trends?.narrative) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 px-5"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink p-5 text-paper">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-coral/40 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-coral/20 ring-1 ring-coral/40"><Sparkles className="size-5 text-coral" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-paper/70">AI insight</p>
                <p className="display mt-1 text-sm font-semibold leading-snug">{trends?.narrative || summary?.insight}</p>
                <Link to="/admin/analytics" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-coral">
                  View analytics <ArrowRight className="size-3.5" />
                </Link>
                <a href="/api/analytics/export/open311" className="mt-2 block text-xs font-bold text-paper/70">Export Open311 bulk</a>
              </div>
            </div>
          </div>
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
