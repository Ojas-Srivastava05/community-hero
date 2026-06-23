import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Sparkles, Download } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { apiAnalyticsSummary, apiHotspots } from '../lib/api'

type Summary = {
  total: number
  open: number
  resolved: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
  avgSeverity: number
  insight: string
}

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [hotspots, setHotspots] = useState<{ geohash: string; count: number }[]>([])

  useEffect(() => {
    apiAnalyticsSummary().then(setSummary).catch(() => {})
    apiHotspots().then((r) => setHotspots(r.hotspots)).catch(() => {})
  }, [])

  const chartData = summary
    ? Object.entries(summary.byCategory).map(([name, count]) => ({ name: name.replace('_', ' '), count }))
    : []

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold">Impact Dashboard</h1>
        <a href="/api/analytics/export/open311" className="btn-ghost flex items-center gap-1 text-xs">
          <Download size={14} /> Open311
        </a>
      </header>

      <main className="space-y-6 px-6 pt-4">
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: summary?.total ?? '—' },
            { label: 'Open', value: summary?.open ?? '—' },
            { label: 'Resolved', value: summary?.resolved ?? '—' },
          ].map(({ label, value }) => (
            <GlassCard key={label} className="text-center py-4">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-mist">{label}</p>
            </GlassCard>
          ))}
        </section>

        {summary?.insight && (
          <GlassCard className="border-teal/20">
            <div className="flex gap-2 text-teal mb-2">
              <Sparkles size={18} />
              <span className="text-sm font-semibold">AI Insight</span>
            </div>
            <p className="text-sm text-mist leading-relaxed">{summary.insight}</p>
          </GlassCard>
        )}

        <GlassCard>
          <h2 className="mb-4 text-sm font-semibold">By category</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#151B23', border: 'none' }} />
                <Bar dataKey="count" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-mist">Hotspots</h2>
          {hotspots.map((h) => (
            <GlassCard key={h.geohash} className="mb-2 flex justify-between py-3 px-4">
              <span className="text-sm">Zone {h.geohash}</span>
              <span className="text-teal font-semibold">{h.count} issues</span>
            </GlassCard>
          ))}
        </section>

        <Link to="/leaderboard" className="btn-ghost block text-center">View leaderboard →</Link>
        <Link to="/admin" className="btn-ghost block text-center text-xs">Admin panel</Link>
      </main>
    </div>
  )
}
