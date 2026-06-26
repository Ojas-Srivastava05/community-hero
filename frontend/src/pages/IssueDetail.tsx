import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp, ChevronLeft, MapPin, RotateCcw, Share2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { useAuth } from '../lib/auth'
import { apiGetIssue, apiGetIssueVoteStatus, apiReopenIssue, apiUpvote } from '../lib/api'
import { usePointsToast } from '@/components/civic/PointsToast'
import { apiSeverityToUi, categoryLabel, issueArea, issueImage, issueReportedAt, slaHoursLeft } from '@/lib/issue-ui'
import { fadeUp, stagger } from '../lib/motion'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '../../../shared/types'

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { showPoints } = usePointsToast()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [events, setEvents] = useState<{ type: string; timestamp: string }[]>([])
  const [upvotes, setUpvotes] = useState(0)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    if (!id) return
    apiGetIssue(id).then((r) => {
      setIssue(r.issue)
      setUpvotes(r.issue.upvoteCount)
      setEvents(r.events as typeof events)
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!user || !id) {
      setVoted(false)
      return
    }
    user.getIdToken().then((token) => apiGetIssueVoteStatus(id, token))
      .then((r) => setVoted(r.voted))
      .catch(() => setVoted(false))
  }, [user, id])

  const boost = async () => {
    if (!user || !id || voted) return
    try {
      const token = await user.getIdToken()
      const r = await apiUpvote(id, token)
      if (r.already) {
        setVoted(true)
        return
      }
      setUpvotes(r.count ?? upvotes + 1)
      setVoted(true)
      if (r.verificationLevel !== undefined) {
        setIssue((prev) => prev ? { ...prev, upvoteCount: r.count ?? prev.upvoteCount + 1, verificationLevel: r.verificationLevel } : prev)
      }
      showPoints(5, 'Boost')
      setEvents((prev) => [
        ...prev,
        { type: 'upvote', timestamp: new Date().toISOString() },
      ])
    } catch {
      /* ignore */
    }
  }

  const reopen = async () => {
    if (!user || !id) return
    try {
      const token = await user.getIdToken()
      await apiReopenIssue(id, token)
      setIssue((prev) => prev ? { ...prev, status: 'Submitted' } : prev)
    } catch {
      /* ignore */
    }
  }

  if (!issue) {
    return (
      <AppShell>
        <div className="px-5 py-20 text-center text-ink-muted">Loading issue…</div>
      </AppShell>
    )
  }

  const sla = slaHoursLeft(issue)
  const canReopen = user && ['Resolved', 'Closed'].includes(issue.status)

  return (
    <AppShell>
      <div className="relative">
        <img src={issue.proofImageUrl || issueImage(issue)} alt={issue.title} className="aspect-[5/6] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-transparent to-background" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link to="/map" className="grid size-10 place-items-center rounded-xl glass-strong"><ChevronLeft className="size-5 text-ink" /></Link>
          <button type="button" className="grid size-10 place-items-center rounded-xl glass-strong" onClick={() => navigator.share?.({ title: issue.title, url: window.location.href })}>
            <Share2 className="size-4 text-ink" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
          <h1 className="display mt-2 text-2xl font-bold text-paper">{issue.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-paper/80">
            <MapPin className="size-3" /> {issueArea(issue)}
          </p>
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-5 px-5 pt-5 pb-40"
      >
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
          <Chip tone="coral">#{issue.id.slice(0, 8)}</Chip>
          <Chip>{categoryLabel(issue.category)}</Chip>
          <Chip>{issue.status}</Chip>
          <Chip>Reported {issueReportedAt(issue)}</Chip>
          {sla !== null && <Chip>{sla}h SLA left</Chip>}
        </motion.div>
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-sm leading-relaxed text-ink">{issue.description}</p>
          </GlassCard>
        </motion.div>
        <motion.div variants={fadeUp}>
          <VerificationBadges upvoteCount={upvotes} verificationLevel={issue.verificationLevel} />
        </motion.div>
        {issue.proofImageUrl && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Resolution proof</p>
              <img src={issue.proofImageUrl} alt="Proof" className="mt-3 w-full rounded-xl object-cover" />
            </GlassCard>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Timeline</p>
            <ol className="mt-4 space-y-4">
              <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <div className="grid size-7 place-items-center rounded-full border border-coral/40 bg-coral-soft text-[10px] font-bold text-coral">1</div>
                <div>
                  <p className="text-sm font-bold text-ink">Reported</p>
                  <p className="text-[11px] text-ink-muted">{issueReportedAt(issue)}</p>
                </div>
              </li>
              {events.map((ev, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
                >
                  <div className="grid size-7 place-items-center rounded-full border border-rule bg-surface text-[10px] font-bold text-ink-muted">{i + 2}</div>
                  <div>
                    <p className="text-sm font-bold capitalize text-ink">{ev.type.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-ink-muted">{formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </GlassCard>
        </motion.div>
      </motion.div>

      <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-[440px] px-5">
        <div className="paper flex items-center gap-3 p-2">
          {canReopen ? (
            <button type="button" onClick={reopen} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rule bg-surface py-3 text-sm font-bold text-ink">
              <RotateCcw className="size-4" /> Reopen
            </button>
          ) : (
            <button
              type="button"
              disabled={!user || voted}
              onClick={boost}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
                voted ? 'bg-coral text-paper ink-glow' : 'border border-rule bg-surface text-ink',
                !user && 'opacity-60',
              )}
            >
              <motion.span animate={{ y: voted ? -2 : 0 }}><ArrowUp className="size-4" /></motion.span>
              {!user ? 'Sign in to boost' : voted ? `Boosted · ${upvotes}` : `Boost · ${upvotes}`}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
