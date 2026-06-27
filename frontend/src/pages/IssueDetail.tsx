import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp, ChevronLeft, Download, MapPin, RotateCcw, Share2, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { IssueDetailSkeleton } from '@/components/PageSkeleton'
import { useAuth } from '../lib/auth'
import { useIssueStore } from '../stores/useIssueStore'
import { apiExportOpen311Single, apiGetIssueVoteStatus, apiReopenIssue, apiUpvote } from '../lib/api'
import { useLiveIssue } from '../lib/use-live-issue'
import { resolveIsAdmin } from '../lib/admin'
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
  const { issue, events: liveEvents, loading } = useLiveIssue(id)
  const [localIssue, setLocalIssue] = useState<Issue | null>(null)
  const [localEvents, setLocalEvents] = useState<{ type: string; timestamp: string }[]>([])
  const displayIssue = localIssue ?? issue
  const events = localEvents.length > liveEvents.length ? localEvents : liveEvents
  const [upvotes, setUpvotes] = useState(0)
  const [voted, setVoted] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [upvoteError, setUpvoteError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setAdmin(false)
      return
    }
    let cancelled = false
    resolveIsAdmin(user).then((isAdmin) => {
      if (!cancelled) setAdmin(isAdmin)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const { upsertIssue } = useIssueStore()

  const prevId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (id !== prevId.current) {
      prevId.current = id
      setLocalIssue(null)
      setLocalEvents([])
    }
  }, [id])

  useEffect(() => {
    if (!issue) return
    upsertIssue(issue)
    setUpvotes(issue.upvoteCount)
  }, [issue, upsertIssue])

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
    setUpvoteError(null)
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
        setLocalIssue((prev) => {
          const base = prev ?? issue
          return base
            ? { ...base, upvoteCount: r.count ?? base.upvoteCount + 1, verificationLevel: r.verificationLevel }
            : prev
        })
      }
      const pe = r.pointsEarned as { pointsAwarded?: number; badgesEarned?: string[] } | undefined
      if (pe?.pointsAwarded && pe.pointsAwarded > 0) {
        const msg = pe.badgesEarned?.length ? pe.badgesEarned.join(' · ') : 'Boost'
        showPoints(pe.pointsAwarded, msg)
      }
      setLocalEvents((prev) => [
        ...(prev.length ? prev : liveEvents),
        { type: 'upvote', timestamp: new Date().toISOString() },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not boost this report'
      setUpvoteError(msg)
    }
  }

  const reopen = async () => {
    if (!user || !id) return
    try {
      const token = await user.getIdToken()
      await apiReopenIssue(id, token)
      setLocalIssue((prev) => {
        const base = prev ?? issue
        return base ? { ...base, status: 'Submitted' } : prev
      })
    } catch {
      /* ignore */
    }
  }

  const exportOpen311 = async () => {
    if (!user || !id || exporting) return
    setExporting(true)
    try {
      const token = await user.getIdToken()
      const record = await apiExportOpen311Single(id, token)
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `open311-${id}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    } finally {
      setExporting(false)
    }
  }

  if (loading || !displayIssue) {
    return (
      <AppShell>
        {loading ? <IssueDetailSkeleton /> : (
          <div className="px-5 py-20 text-center text-ink-muted">Issue not found</div>
        )}
      </AppShell>
    )
  }

  const sla = slaHoursLeft(displayIssue)
  const isReporter = user?.uid === displayIssue.reporterId
  const canReopen = user && (isReporter || admin) && ['Resolved', 'Closed'].includes(displayIssue.status)
  const imageAlt = `${displayIssue.title} — ${categoryLabel(displayIssue.category)} report photo`

  return (
    <AppShell hideNav>
      <div className="relative">
        <img src={displayIssue.proofImageUrl || issueImage(displayIssue)} alt={imageAlt} className="aspect-[5/6] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-transparent to-background" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link to="/map" className="grid size-10 place-items-center rounded-xl glass-strong"><ChevronLeft className="size-5 text-ink" /></Link>
          <div className="flex gap-2">
            {admin && (
              <button
                type="button"
                disabled={exporting}
                onClick={exportOpen311}
                className="grid size-10 place-items-center rounded-xl glass-strong"
                aria-label="Export Open311 JSON"
              >
                <Download className="size-4 text-ink" />
              </button>
            )}
            <button type="button" className="grid size-10 place-items-center rounded-xl glass-strong" onClick={() => navigator.share?.({ title: displayIssue.title, url: window.location.href })}>
              <Share2 className="size-4 text-ink" />
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <SeverityBadge severity={apiSeverityToUi(displayIssue.severity)} />
          <h1 className="display mt-2 text-2xl font-bold text-paper">{displayIssue.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-paper/80">
            <MapPin className="size-3" /> {issueArea(displayIssue)}
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
          <Chip tone="coral">#{displayIssue.id.slice(0, 8)}</Chip>
          <Chip>{categoryLabel(displayIssue.category)}</Chip>
          <Chip>{displayIssue.status}</Chip>
          <Chip>Reported {issueReportedAt(displayIssue)}</Chip>
          {sla !== null && !displayIssue.slaBreached && <Chip>{sla}h SLA left</Chip>}
          {displayIssue.slaBreached && (
            <Chip tone="coral">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="size-3" /> SLA breached
              </span>
            </Chip>
          )}
        </motion.div>
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-sm leading-relaxed text-ink">{displayIssue.description}</p>
          </GlassCard>
        </motion.div>
        <motion.div variants={fadeUp}>
          <VerificationBadges upvoteCount={upvotes} verificationLevel={displayIssue.verificationLevel} />
        </motion.div>
        {displayIssue.proofImageUrl && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Resolution proof</p>
              <img src={displayIssue.proofImageUrl} alt={`Resolution proof for ${displayIssue.title}`} className="mt-3 w-full rounded-xl object-cover" />
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
                  <p className="text-[11px] text-ink-muted">{issueReportedAt(displayIssue)}</p>
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

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 mx-auto max-w-[440px] px-5">
        <div className="paper flex flex-col gap-2 p-2">
          {upvoteError && (
            <p className="rounded-xl border border-sev-critical/30 bg-sev-critical/10 px-3 py-2 text-xs text-sev-critical">
              {upvoteError}
            </p>
          )}
          <div className="flex items-center gap-3">
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
      </div>
    </AppShell>
  )
}
