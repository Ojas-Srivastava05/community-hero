import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, RotateCcw } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { useAuth } from '../lib/auth'
import { apiMyReports, apiReopenIssue } from '../lib/api'
import { apiSeverityToUi, issueArea, slaHoursLeft } from '@/lib/issue-ui'
import { fadeUp, stagger } from '../lib/motion'
import { PageSkeleton } from '@/components/PageSkeleton'
import { cn } from '@/lib/utils'
import type { Issue } from '../../../shared/types'

function statusTone(s: string) {
  if (s === 'Resolved' || s === 'Closed') return 'ok' as const
  if (s === 'In Progress') return 'coral' as const
  if (s === 'Assigned' || s === 'Community Verified') return 'warn' as const
  return 'default' as const
}

export function MyReportsPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    user.getIdToken()
      .then((token) => apiMyReports(token).then((r) => setIssues(r.issues)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const reopen = async (id: string) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await apiReopenIssue(id, token)
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Submitted' } : i)))
    } catch {
      /* ignore */
    }
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="My reports" />
        <div className="px-5 py-16 text-center">
          <p className="text-ink-muted">Sign in to track your submissions</p>
          <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="mt-6 rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow">
            Sign in with Google
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="My reports" subtitle={loading ? 'Loading…' : `${issues.length} submissions`} />
      {loading ? (
        <PageSkeleton rows={4} />
      ) : (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3 px-5 pt-4">
        {issues.map((i) => {
          const sla = slaHoursLeft(i)
          const resolved = i.status === 'Resolved' || i.status === 'Closed'
          return (
            <motion.div key={i.id} variants={fadeUp}>
              <Link to={`/issues/${i.id}`} className="paper block overflow-hidden p-4 transition-transform active:scale-[0.99]">
                <div className="flex items-center justify-between gap-3">
                  <Chip tone={statusTone(i.status)}>{i.status}</Chip>
                  <SeverityBadge severity={apiSeverityToUi(i.severity)} />
                </div>
                <p className="mt-3 text-sm font-bold leading-snug text-ink">{i.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">{issueArea(i)}</p>
                <div className="mt-2">
                  <VerificationBadges
                    upvoteCount={i.upvoteCount}
                    verificationLevel={i.verificationLevel ?? 0}
                    compact
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className={cn('flex items-center gap-1.5 text-[11px] font-semibold', resolved ? 'text-leaf' : sla !== null && sla <= 24 ? 'text-sev-critical' : 'text-ink-muted')}>
                    <Clock className="size-3" />
                    {resolved ? 'Closed' : sla === null ? 'SLA pending' : sla <= 0 ? 'SLA breached' : `${sla}h to SLA`}
                  </div>
                  <div className="flex items-center gap-2">
                    {resolved && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          void reopen(i.id)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rule px-2 py-1 text-[10px] font-bold text-ink"
                      >
                        <RotateCcw className="size-3" /> Reopen
                      </button>
                    )}
                    <div className="text-[11px] text-ink-muted">{i.upvoteCount} boosts</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
        {issues.length === 0 && <p className="py-12 text-center text-ink-muted">No reports yet — <Link to="/report" className="text-coral">report an issue</Link></p>}
      </motion.div>
      )}
    </AppShell>
  )
}
