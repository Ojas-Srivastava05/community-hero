import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ThumbsUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GlassCard, SeverityDot } from '../components/GlassCard'
import { useAuth } from '../lib/auth'
import { apiGetIssue, apiUpvote } from '../lib/api'
import type { Issue } from '../../../shared/types'

function severityLevel(s: number): 'critical' | 'high' | 'medium' | 'low' {
  if (s >= 5) return 'critical'
  if (s >= 4) return 'high'
  if (s >= 3) return 'medium'
  return 'low'
}

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [events, setEvents] = useState<{ type: string; timestamp: string; payload?: unknown }[]>([])
  const [upvoting, setUpvoting] = useState(false)

  useEffect(() => {
    if (!id) return
    apiGetIssue(id).then((r) => {
      setIssue(r.issue)
      setEvents(r.events as typeof events)
    }).catch(() => {})
  }, [id])

  const upvote = async () => {
    if (!user || !id) return
    setUpvoting(true)
    try {
      const token = await user.getIdToken()
      const r = await apiUpvote(id, token)
      if (issue) setIssue({ ...issue, upvoteCount: r.count ?? issue.upvoteCount + 1 })
    } finally {
      setUpvoting(false)
    }
  }

  if (!issue) {
    return <div className="p-6 text-mist">Loading…</div>
  }

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 flex items-center gap-3 px-6 py-4">
        <Link to="/map"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-semibold truncate">Issue Detail</h1>
      </header>

      <main className="space-y-4 px-6 pt-2">
        {issue.imageUrls?.[0] && (
          <img src={issue.imageUrls[0]} alt="" className="w-full rounded-2xl object-cover max-h-56" />
        )}
        <div className="flex items-center gap-2">
          <SeverityDot level={severityLevel(issue.severity)} />
          <span className="text-xs uppercase text-mist">{issue.category.replace('_', ' ')}</span>
          <span className="ml-auto rounded-full bg-teal/15 px-2 py-0.5 text-xs text-teal">{issue.status}</span>
        </div>
        <h2 className="text-xl font-semibold">{issue.title}</h2>
        <p className="text-mist text-sm">{issue.description}</p>

        <GlassCard className="flex items-center justify-between">
          <div>
            <p className="text-xs text-mist">Department</p>
            <p className="font-medium">{issue.departmentId || 'Routing…'}</p>
          </div>
          {issue.slaDeadline && (
            <div className="text-right">
              <p className="text-xs text-mist flex items-center gap-1 justify-end"><Clock size={12} /> SLA</p>
              <p className="text-sm">{formatDistanceToNow(new Date(issue.slaDeadline), { addSuffix: true })}</p>
            </div>
          )}
        </GlassCard>

        <button
          type="button"
          className="btn-primary flex items-center justify-center gap-2"
          disabled={!user || upvoting}
          onClick={upvote}
        >
          <ThumbsUp size={18} />
          Community verify ({issue.upvoteCount})
        </button>

        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-mist">Timeline</h3>
          <div className="space-y-2 border-l border-white/10 pl-4">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal" />
              <p className="text-sm">Reported {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</p>
            </div>
            {events.map((ev, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-mist" />
                <p className="text-sm capitalize">{ev.type.replace('_', ' ')}</p>
                <p className="text-xs text-mist">{formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
