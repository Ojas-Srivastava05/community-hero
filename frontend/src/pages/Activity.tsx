import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUp, Check, FilePlus, Loader2, MessageSquare } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { apiListIssues } from '../lib/api'
import { useLocation } from '../lib/location'
import { haversineKm } from '../lib/geo'
import { fadeUp, stagger } from '../lib/motion'
import { issueArea, issueReportedAt } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

type ActivityTab = 'all' | 'ward' | 'resolved'

export function ActivityPage() {
  const { location, loading: locLoading } = useLocation()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ActivityTab>('all')

  useEffect(() => {
    setLoading(true)
    const opts = location
      ? { lat: location.lat, lng: location.lng, radiusKm: 25 }
      : undefined
    apiListIssues(50, opts)
      .then((r) => setIssues(r.issues))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false))
  }, [location])

  const filtered = useMemo(() => {
    let list = [...issues].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
    )

    if (tab === 'ward' && location) {
      list = list.filter((i) => haversineKm(location.lat, location.lng, i.lat, i.lng) <= 5)
    }
    if (tab === 'resolved') {
      list = list.filter((i) => ['Resolved', 'Closed'].includes(i.status))
    }

    return list.slice(0, 20)
  }, [issues, tab, location])

  const subtitle = location?.label
    ? `Updates near ${location.label}`
    : locLoading
      ? 'Finding your area…'
      : 'Community updates near you'

  return (
    <AppShell>
      <PageHeader title="Activity" subtitle={subtitle} />
      <div className="px-5 pt-4">
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <Tab active={tab === 'all'} onClick={() => setTab('all')}>All</Tab>
          <Tab active={tab === 'ward'} onClick={() => setTab('ward')}>Your ward</Tab>
          <Tab active={tab === 'resolved'} onClick={() => setTab('resolved')}>Resolved</Tab>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-coral" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            {tab === 'resolved'
              ? 'No resolved issues near you yet.'
              : tab === 'ward'
                ? 'No activity in your immediate area yet. Try the All tab or report an issue.'
                : location
                  ? 'No community activity near you yet. Be the first to report something.'
                  : 'Enable location to see nearby activity, or report an issue to get started.'}
          </p>
        ) : (
          <motion.ol
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative space-y-3 border-l border-rule pl-4"
          >
            {filtered.map((issue) => {
              const Icon = issue.status === 'Resolved' || issue.status === 'Closed' ? Check : issue.upvoteCount > 5 ? ArrowUp : FilePlus
              const resolved = issue.status === 'Resolved' || issue.status === 'Closed'
              const tone = resolved ? 'text-leaf bg-leaf-soft' : 'text-coral bg-coral-soft'
              const action = resolved ? 'resolved' : 'reported'
              const threadId = issue.geohash ? `thread-${issue.geohash.slice(0, 5)}` : null
              return (
                <motion.li key={issue.id} variants={fadeUp} className="relative">
                  <span className={`absolute -left-[1.4rem] grid size-7 place-items-center rounded-full border border-rule ${tone}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="paper px-4 py-3 transition-transform active:scale-[0.99]">
                    <Link to={`/issues/${issue.id}`} className="block">
                      <p className="text-sm text-ink">
                        <span className="font-bold">Community</span>{' '}
                        <span className="text-ink-muted">{action}</span>{' '}
                        <span className="font-semibold text-coral">{issue.title}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-ink-muted">
                        {issueArea(issue)} · {issueReportedAt(issue)} · {issue.upvoteCount} boosts
                      </p>
                    </Link>
                    {threadId && (
                      <Link
                        to={`/threads/${threadId}`}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo"
                      >
                        <MessageSquare className="size-3" /> View thread cluster
                      </Link>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </motion.ol>
        )}
      </div>
    </AppShell>
  )
}

function Tab({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip whitespace-nowrap ${active ? 'bg-coral-soft text-coral border-coral/30' : ''}`}
    >
      {children}
    </button>
  )
}
