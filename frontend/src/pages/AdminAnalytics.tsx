import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, MapPin, Sparkles } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, SectionHeader } from '@/components/civic/GlassCard'
import { useAuth } from '../lib/auth'
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
}

export function AdminAnalyticsPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [byCategory, setByCategory] = useState<Record<string, number>>({})
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([apiHotspots(), apiAnalyticsSummary(), apiTrends().catch(() => null)])
      .then(([h, s, t]) => {
        setHotspots(h.hotspots ?? [])
        setByCategory(s.byCategory ?? {})
        setNarrative(t?.narrative || s.insight || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const chartData = Object.entries(byCategory).map(([name, count]) => ({
    name: name.replace(/_/g, ' ').slice(0, 12),
    count,
  }))

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Admin analytics" />
        <div className="px-5 py-16 text-center">
          <p className="mb-4 text-ink-muted">Admin sign-in required</p>
          <button type="button" className="rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow" disabled={signingIn} onClick={() => signInWithGoogle()}>
            {signingIn ? 'Opening Google…' : 'Sign in'}
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Admin analytics" subtitle="Hotspots · category breakdown" />
      <main className="space-y-6 px-5 pt-4 pb-10">
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

        <section>
          <SectionHeader title="Hotspot cells" hint="Predictive clusters" />
          {loading ? (
            <p className="text-sm text-ink-muted">Loading hotspots…</p>
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
    </AppShell>
  )
}
