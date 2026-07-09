import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUp,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
  RotateCcw,
  Scale,
  Share2,
  AlertTriangle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { IssueDetailSkeleton } from '@/components/PageSkeleton'
import { useAuth } from '../lib/auth'
import { useIssueStore } from '../stores/useIssueStore'
import { apiExportOpen311Single, apiGetIssueVoteStatus, apiListComments, apiPostComment, apiReopenIssue, apiUpvote } from '../lib/api'
import { useLiveIssue } from '../lib/use-live-issue'
import { resolveIsAdmin } from '../lib/admin'
import { usePointsToast } from '@/components/civic/PointsToast'
import { apiSeverityToUi, categoryLabel, issueArea, issueImage, issueReportedAt, slaHoursLeft } from '@/lib/issue-ui'
import { BeforeAfterSlider } from '@/components/civic/BeforeAfterSlider'
import { ResolutionVerificationBadge } from '@/components/civic/ResolutionVerificationBadge'
import { AgentPipelineStepper } from '@/components/civic/AgentPipelineStepper'
import { buildComplaintDraft, copyComplaintDraft } from '../lib/complaint-draft'
import { estimateCostOfInaction, formatInr } from '../lib/authority-copilot'
import { useI18n } from '../lib/i18n'
import type { AgentStep, ProofComparison } from '../lib/shared-constants'
import { fadeUp, stagger } from '../lib/motion'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '../../../shared/types'

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signingIn } = useAuth()
  const { showPoints } = usePointsToast()
  const { t } = useI18n()
  const { issue, events: liveEvents, loading } = useLiveIssue(id)
  const [localIssue, setLocalIssue] = useState<Issue | null>(null)
  const [localEvents, setLocalEvents] = useState<{ type: string; timestamp: string }[]>([])
  const displayIssue = localIssue ?? issue
  const events = localEvents.length > liveEvents.length ? localEvents : liveEvents
  const [upvotes, setUpvotes] = useState(0)
  const [voted, setVoted] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [boosting, setBoosting] = useState(false)
  const [upvoteError, setUpvoteError] = useState<string | null>(null)
  const [comments, setComments] = useState<{ id: string; authorName: string; body: string; createdAt: string }[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [copiedComplaint, setCopiedComplaint] = useState(false)
  const needsReviewNav = Boolean((location.state as { needsReview?: boolean } | null)?.needsReview)

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

  useEffect(() => {
    if (!id) return
    apiListComments(id)
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]))
  }, [id])

  const postComment = async () => {
    if (!user || !id || !commentBody.trim()) {
      if (!user) navigate('/login')
      return
    }
    setPostingComment(true)
    try {
      const token = await user.getIdToken()
      const r = await apiPostComment(id, commentBody.trim(), token)
      setComments((prev) => [...prev, r.comment])
      setCommentBody('')
    } catch (e) {
      setUpvoteError(e instanceof Error ? e.message : 'Could not post comment')
    } finally {
      setPostingComment(false)
    }
  }

  const boost = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!id || voted || boosting) return
    setUpvoteError(null)
    setBoosting(true)
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
      } else {
        showPoints(0, 'Boost recorded')
      }
      setLocalEvents((prev) => [
        ...(prev.length ? prev : liveEvents),
        { type: 'upvote', timestamp: new Date().toISOString() },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not boost this report'
      setUpvoteError(msg)
    } finally {
      setBoosting(false)
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
  const proofComparison = displayIssue.aiMetadata?.proofComparison as ProofComparison | undefined
  const beforePhoto = issueImage(displayIssue)
  const afterPhoto = displayIssue.proofImageUrl
  const confidence =
    typeof displayIssue.aiMetadata?.confidence === 'number'
      ? (displayIssue.aiMetadata.confidence as number)
      : null
  const needsReview =
    needsReviewNav ||
    displayIssue.status === 'Draft' ||
    displayIssue.aiMetadata?.needs_review === true ||
    (confidence !== null && confidence < 0.7)
  const dupSuggestions = Array.isArray(displayIssue.aiMetadata?.duplicate_suggestions)
    ? (displayIssue.aiMetadata.duplicate_suggestions as unknown[])
    : []
  const complaint = buildComplaintDraft(displayIssue)
  const cost = estimateCostOfInaction(displayIssue)

  const agentStepsFromEvents: AgentStep[] = (() => {
    const ids = ['intake', 'vision', 'dedup', 'routing', 'communicator', 'insights'] as const
    const labelMap: Record<(typeof ids)[number], string> = {
      intake: 'Intake Agent',
      vision: 'Vision Agent',
      dedup: 'Dedup Agent',
      routing: 'Routing Agent',
      communicator: 'Communicator Agent',
      insights: 'Insights Agent',
    }
    const seen = new Set<string>()
    for (const ev of events) {
      const t = ev.type.toLowerCase()
      if (t.includes('vision') || t.includes('ai_analysis') || t.includes('analyze')) seen.add('vision')
      else if (t.includes('dedup')) seen.add('dedup')
      else if (t.includes('rout') || t.includes('status') || t.includes('assign') || t.includes('sla')) seen.add('routing')
      else if (t.includes('notif') || t.includes('communicat')) seen.add('communicator')
      else if (t.includes('insight') || t.includes('priority') || t.includes('hotspot')) seen.add('insights')
      else if (t.includes('creat') || t.includes('intake')) seen.add('intake')
    }
    if (events.length > 0) seen.add('intake')
    if (displayIssue.departmentId) seen.add('routing')
    seen.add('dedup')
    return ids.map((id) => ({
      id,
      label: labelMap[id],
      status: (seen.has(id) ? 'done' : 'pending') as AgentStep['status'],
      detail:
        id === 'routing' && displayIssue.departmentId
          ? `Routed to ${displayIssue.departmentId}`
          : id === 'dedup'
            ? dupSuggestions.length > 0
              ? `Triple-layer match (visual + geo + semantic) · ${dupSuggestions.length} nearby`
              : 'Triple-layer clear — visual + geo + semantic'
            : id === 'vision' && confidence !== null
              ? `${Math.round(confidence * 100)}% confidence${needsReview ? ' · Judge gate' : ''}`
              : undefined,
    }))
  })()

  const shareIssue = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: displayIssue.title, text: displayIssue.description, url })
        return
      } catch {
        /* fall through */
      }
    }
    window.open(complaint.whatsappHref, '_blank', 'noopener,noreferrer')
  }

  const onCopyComplaint = async () => {
    try {
      await copyComplaintDraft(displayIssue)
      setCopiedComplaint(true)
      window.setTimeout(() => setCopiedComplaint(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <AppShell hideNav>
      <div className="relative">
        <img src={afterPhoto || beforePhoto} alt={imageAlt} className="aspect-[5/6] w-full object-cover" />
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
            <button
              type="button"
              aria-label="Share issue"
              className="grid size-10 place-items-center rounded-xl glass-strong"
              onClick={shareIssue}
            >
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
          {displayIssue.departmentId && <Chip tone="indigo">{displayIssue.departmentId}</Chip>}
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
        {needsReview && (
          <motion.div variants={fadeUp}>
            <GlassCard className="border border-amber/40 bg-amber-soft/50">
              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 size-5 shrink-0 text-amber" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber">Judge gate · human-in-the-loop</p>
                  <p className="mt-1 text-sm text-ink">
                    Vision confidence{confidence !== null ? ` ${Math.round(confidence * 100)}%` : ''} is below the review
                    threshold. An authority must confirm category, severity, and routing before this leaves Draft.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-sm leading-relaxed text-ink">{displayIssue.description}</p>
          </GlassCard>
        </motion.div>
        <motion.div variants={fadeUp}>
          <GlassCard className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-coral" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Authority complaint draft</p>
            </div>
            <p className="text-[11px] text-ink-muted">
              Formal letter to {complaint.to} — FixMyStreet-style escalation with ticket ID, SLA, and live link.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={complaint.mailtoHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-xs font-bold text-paper"
              >
                <FileText className="size-3.5" /> Email department
              </a>
              <a
                href={complaint.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-surface px-3 py-2 text-xs font-bold text-ink"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
              <button
                type="button"
                onClick={onCopyComplaint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-surface px-3 py-2 text-xs font-bold text-ink"
              >
                <Copy className="size-3.5" /> {copiedComplaint ? 'Copied' : 'Copy draft'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
        {!['Resolved', 'Closed'].includes(displayIssue.status) && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <div className="flex items-center gap-2">
                <IndianRupee className="size-4 text-coral" />
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Cost of inaction</p>
              </div>
              <p className="mt-2 text-lg font-bold text-ink">{cost.label}</p>
              <p className="text-[11px] text-ink-muted">
                ~{formatInr(cost.weeklyInr)} / week if left open — demo estimate for authority prioritisation.
              </p>
              <ul className="mt-2 space-y-1">
                {cost.drivers.map((d) => (
                  <li key={d} className="text-[11px] text-ink-muted">
                    · {d}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <VerificationBadges upvoteCount={upvotes} verificationLevel={displayIssue.verificationLevel} />
        </motion.div>
        {agentStepsFromEvents.some((s) => s.status === 'done') && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <AgentPipelineStepper steps={agentStepsFromEvents} />
            </GlassCard>
          </motion.div>
        )}
        {afterPhoto && beforePhoto && (
          <motion.div variants={fadeUp} className="space-y-3">
            <ResolutionVerificationBadge comparison={proofComparison} />
            <GlassCard>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('proof.slider')}</p>
              <BeforeAfterSlider beforeUrl={beforePhoto} afterUrl={afterPhoto} className="mt-3" />
            </GlassCard>
          </motion.div>
        )}
        {afterPhoto && !beforePhoto && (
          <motion.div variants={fadeUp}>
            <GlassCard>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Resolution proof</p>
              <img src={afterPhoto} alt={`Resolution proof for ${displayIssue.title}`} className="mt-3 w-full rounded-xl object-cover" />
            </GlassCard>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('comments.title')}</p>
            <ul className="mt-3 max-h-48 space-y-3 overflow-y-auto">
              {comments.length === 0 && (
                <li className="text-[11px] text-ink-muted">No comments yet — start the neighbourhood discussion.</li>
              )}
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-rule bg-surface/60 px-3 py-2">
                  <p className="text-[11px] font-bold text-ink">{c.authorName}</p>
                  <p className="mt-0.5 text-sm text-ink">{c.body}</p>
                  <p className="mt-1 text-[10px] text-ink-muted">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder={user ? t('comments.placeholder') : t('comments.signIn')}
                className="min-w-0 flex-1 rounded-xl border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-coral/30"
                maxLength={1000}
              />
              <button
                type="button"
                disabled={postingComment || (!!user && commentBody.trim().length < 2)}
                onClick={postComment}
                className="rounded-xl bg-coral px-3 py-2 text-xs font-bold text-paper disabled:opacity-50"
              >
                {postingComment ? <Loader2 className="size-4 animate-spin" /> : t('comments.post')}
              </button>
            </div>
          </GlassCard>
        </motion.div>
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
              disabled={voted || boosting || signingIn}
              onClick={boost}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
                voted ? 'bg-coral text-paper ink-glow' : 'border border-rule bg-surface text-ink',
              )}
            >
              {boosting || signingIn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <motion.span animate={{ y: voted ? -2 : 0 }}><ArrowUp className="size-4" /></motion.span>
              )}
              {!user ? 'Sign in to boost' : voted ? `Boosted · ${upvotes}` : `Boost · ${upvotes}`}
            </button>
          )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
