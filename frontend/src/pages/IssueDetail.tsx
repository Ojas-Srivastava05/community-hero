import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp, ChevronLeft, MapPin, RotateCcw, Share2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { useAuth } from '../lib/auth'
import { apiGetIssue, apiReopenIssue, apiUpvote } from '../lib/api'
import { apiSeverityToUi, categoryLabel, issueArea, issueImage, issueReportedAt, slaHoursLeft } from '@/lib/issue-ui'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '../../../shared/types'

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
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

  const boost = async () => {
    if (!user || !id) return
    try {
      const token = await user.getIdToken()
      const r = await apiUpvote(id, token)
      setUpvotes(r.count ?? upvotes + 1)
      setVoted(true)
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
        <div className="px-5 py-20 text-center text-muted-foreground">Loading issue…</div>
      </AppShell>
    )
  }

  const sla = slaHoursLeft(issue)
  const canReopen = user && ['Resolved', 'Closed'].includes(issue.status)

  return (
    <AppShell>
      <div className="relative">
        <img src={issue.proofImageUrl || issueImage(issue)} alt={issue.title} className="aspect-[5/6] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link to="/map" className="grid size-10 place-items-center rounded-xl glass-strong"><ChevronLeft className="size-5" /></Link>
          <button type="button" className="grid size-10 place-items-center rounded-xl glass-strong" onClick={() => navigator.share?.({ title: issue.title, url: window.location.href })}>
            <Share2 className="size-4" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{issue.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {issueArea(issue)}
          </p>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="teal">#{issue.id.slice(0, 8)}</Chip>
          <Chip>{categoryLabel(issue.category)}</Chip>
          <Chip>{issue.status}</Chip>
          <Chip>Reported {issueReportedAt(issue)}</Chip>
          {sla !== null && <Chip>{sla}h SLA left</Chip>}
        </div>
        <GlassCard>
          <p className="text-sm leading-relaxed">{issue.description}</p>
        </GlassCard>
        {issue.proofImageUrl && (
          <GlassCard>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolution proof</p>
            <img src={issue.proofImageUrl} alt="Proof" className="mt-3 w-full rounded-xl object-cover" />
          </GlassCard>
        )}
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</p>
          <ol className="mt-4 space-y-4">
            <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="grid size-7 place-items-center rounded-full border border-teal/50 bg-teal/20 text-[10px] font-bold text-teal">1</div>
              <div>
                <p className="text-sm font-bold">Reported</p>
                <p className="text-[11px] text-muted-foreground">{issueReportedAt(issue)}</p>
              </div>
            </li>
            {events.map((ev, i) => (
              <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <div className="grid size-7 place-items-center rounded-full border border-glass-border text-[10px] font-bold text-muted-foreground">{i + 2}</div>
                <div>
                  <p className="text-sm font-bold capitalize">{ev.type.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}</p>
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-[440px] px-5">
        <div className="glass-strong flex items-center gap-3 rounded-2xl p-2">
          {canReopen ? (
            <button type="button" onClick={reopen} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-glass py-3 text-sm font-bold">
              <RotateCcw className="size-4" /> Reopen
            </button>
          ) : (
            <button
              type="button"
              disabled={!user}
              onClick={boost}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
                voted ? 'bg-teal text-primary-foreground teal-glow' : 'bg-glass text-foreground',
              )}
            >
              <motion.span animate={{ y: voted ? -2 : 0 }}><ArrowUp className="size-4" /></motion.span>
              Boost · {upvotes}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
