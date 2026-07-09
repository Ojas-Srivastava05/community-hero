import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, ChevronLeft } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { apiScorecards, type DepartmentScorecard } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { cn } from '@/lib/utils'

function gradeClass(grade: DepartmentScorecard['grade']) {
  return {
    A: 'bg-leaf-soft text-leaf border-leaf/30',
    B: 'bg-coral-soft text-coral border-coral/30',
    C: 'bg-amber-soft text-amber border-amber/40',
    D: 'bg-sev-critical/10 text-sev-critical border-sev-critical/30',
  }[grade]
}

export function ScorecardsPage() {
  const { t } = useI18n()
  const [cards, setCards] = useState<DepartmentScorecard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiScorecards()
      .then((r) => setCards(r.scorecards))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <PageHeader
        title={t('scorecards.title')}
        subtitle="Public accountability — resolution rate, SLA compliance, turnaround"
        right={
          <Link to="/dashboard" className="grid size-9 place-items-center rounded-xl border border-rule">
            <ChevronLeft className="size-4 text-ink" />
          </Link>
        }
      />
      <div className="space-y-4 px-5 pb-10 pt-4">
        {loading && <p className="text-sm text-ink-muted">Loading scorecards…</p>}
        {!loading && cards.length === 0 && (
          <GlassCard>
            <p className="text-sm text-ink-muted">No department data yet. Seed demo issues or file reports to populate scorecards.</p>
          </GlassCard>
        )}
        {cards.map((card, i) => (
          <motion.div key={card.departmentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-surface">
                    <Building2 className="size-5 text-coral" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{card.departmentId}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {card.resolved}/{card.total} resolved · {card.open} open
                    </p>
                  </div>
                </div>
                <span className={cn('rounded-full border px-2.5 py-1 text-xs font-black', gradeClass(card.grade))}>
                  {card.grade}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-surface px-2 py-2">
                  <p className="text-lg font-bold text-ink">{card.resolutionRate}%</p>
                  <p className="text-[10px] text-ink-muted">Resolved</p>
                </div>
                <div className="rounded-xl bg-surface px-2 py-2">
                  <p className="text-lg font-bold text-ink">{card.slaCompliance ?? '—'}{card.slaCompliance !== null ? '%' : ''}</p>
                  <p className="text-[10px] text-ink-muted">SLA OK</p>
                </div>
                <div className="rounded-xl bg-surface px-2 py-2">
                  <p className="text-lg font-bold text-ink">{card.avgTurnaroundHours ?? '—'}{card.avgTurnaroundHours !== null ? 'h' : ''}</p>
                  <p className="text-[10px] text-ink-muted">Avg fix</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </AppShell>
  )
}
