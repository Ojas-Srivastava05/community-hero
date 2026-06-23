import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Check, FilePlus } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { apiListIssues } from '../lib/api'
import { issueReportedAt } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

export function ActivityPage() {
  const [recent, setRecent] = useState<Issue[]>([])

  useEffect(() => {
    apiListIssues(15).then((r) => setRecent(r.issues)).catch(() => {})
  }, [])

  return (
    <AppShell>
      <PageHeader title="Activity" subtitle="Community updates" />
      <div className="px-5 pt-4">
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <Tab active>All</Tab>
          <Tab>Your ward</Tab>
          <Tab>Resolved</Tab>
        </div>
        <ol className="relative space-y-3 border-l border-glass-border pl-4">
          {recent.map((issue) => {
            const Icon = issue.status === 'Resolved' ? Check : issue.upvoteCount > 5 ? ArrowUp : FilePlus
            const tone = issue.status === 'Resolved' ? 'text-sev-low bg-sev-low/15' : 'text-teal bg-teal/15'
            return (
              <li key={issue.id} className="relative">
                <span className={`absolute -left-[1.4rem] grid size-7 place-items-center rounded-full border border-glass-border ${tone}`}>
                  <Icon className="size-3.5" />
                </span>
                <Link to={`/issues/${issue.id}`} className="glass block px-4 py-3">
                  <p className="text-sm">
                    <b>Community</b>{' '}
                    <span className="text-muted-foreground">{issue.status === 'Resolved' ? 'resolved' : 'reported'}</span>{' '}
                    <b className="text-teal">{issue.title}</b>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{issueReportedAt(issue)} · {issue.upvoteCount} boosts</p>
                </Link>
              </li>
            )
          })}
        </ol>
        {recent.length === 0 && <p className="py-8 text-center text-muted-foreground">No activity yet</p>}
      </div>
    </AppShell>
  )
}

function Tab({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <button type="button" className={`chip whitespace-nowrap ${active ? 'bg-teal/15 text-teal border-teal/40' : ''}`}>{children}</button>
}
