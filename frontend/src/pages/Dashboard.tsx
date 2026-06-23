import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { apiAnalyticsSummary } from '../lib/api'
import { useLocation } from '../lib/location'

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

  useEffect(() => {
    apiAnalyticsSummary().then(setSummary).catch(() => {})
  }, [])

  const chartData = summary
    ? Object.entries(summary.byCategory).map(([name, count]) => ({ name: name.replace('_', ' ').slice(0, 10), count }))
    : []

  return (
    <AppShell>
      <PageHeader title="Civic dashboard" subtitle={location ? `${location.label} · live` : 'Live data'} />
      <section className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Total" value={String(summary?.total ?? '—')} delta="live" />
          <Kpi label="Open" value={String(summary?.open ?? '—')} delta="active" />
          <Kpi label="Resolved" value={String(summary?.resolved ?? '—')} delta="done" good />
          <Kpi label="Avg resolve" value={summary?.avgResolutionHours ? `${Math.round(summary.avgResolutionHours)}h` : '—'} delta="SLA" good />
        </div>
      </section>
      <section className="mt-6 px-5">
        <SectionHeader title="By category" hint="All reports" />
        <GlassCard className="pt-5">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" stroke="oklch(0.7 0.025 250)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.025 250)" fontSize={11} tickLine={false} axisLine={false} width={28} />
                <Tooltip cursor={{ fill: 'oklch(1 0 0 / 0.04)' }} contentStyle={{ background: 'oklch(0.235 0.014 245)', border: '1px solid oklch(1 0 0 / 0.1)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="oklch(0.72 0.13 184)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>
      {summary?.insight && (
        <section className="mt-6 px-5">
          <div className="relative overflow-hidden rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/15 via-glass to-glass p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-teal/20 ring-1 ring-teal/40"><Sparkles className="size-5 text-teal" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal">AI insight</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{summary.insight}</p>
                <a href="/api/analytics/export/open311" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal">Export Open311 <ArrowRight className="size-3.5" /></a>
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  )
}

function Kpi({ label, value, delta, good }: { label: string; value: string; delta: string; good?: boolean }) {
  return (
    <GlassCard>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${good ? 'text-sev-low' : 'text-teal'}`}>
        <TrendingUp className="size-3" /> {delta}
      </div>
    </GlassCard>
  )
}
