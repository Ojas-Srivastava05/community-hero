import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Chip } from '@/components/civic/GlassCard'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { useAuth } from '../lib/auth'
import { apiMyReports } from '../lib/api'
import { apiSeverityToUi, issueArea, slaHoursLeft } from '@/lib/issue-ui'
import { cn } from '@/lib/utils'
import type { Issue } from '../../../shared/types'

function statusTone(s: string) {
  if (s === 'Resolved' || s === 'Closed') return 'ok' as const
  if (s === 'In Progress') return 'teal' as const
  if (s === 'Assigned' || s === 'Community Verified') return 'warn' as const
  return 'default' as const
}

export function MyReportsPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    if (!user) return
    user.getIdToken().then((token) => apiMyReports(token).then((r) => setIssues(r.issues)))
  }, [user])

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="My reports" />
        <div className="px-5 py-16 text-center">
          <p className="text-muted-foreground">Sign in to track your submissions</p>
          <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="mt-6 rounded-2xl bg-teal px-8 py-3 text-sm font-bold text-primary-foreground teal-glow">
            Sign in with Google
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="My reports" subtitle={`${issues.length} submissions`} />
      <div className="space-y-3 px-5 pt-4">
        {issues.map((i) => {
          const sla = slaHoursLeft(i)
          const resolved = i.status === 'Resolved' || i.status === 'Closed'
          return (
            <Link key={i.id} to={`/issues/${i.id}`} className="glass block overflow-hidden p-4">
              <div className="flex items-center justify-between gap-3">
                <Chip tone={statusTone(i.status)}>{i.status}</Chip>
                <SeverityBadge severity={apiSeverityToUi(i.severity)} />
              </div>
              <p className="mt-3 text-sm font-bold leading-snug">{i.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{issueArea(i)}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className={cn('flex items-center gap-1.5 text-[11px] font-semibold', resolved ? 'text-sev-low' : sla !== null && sla <= 24 ? 'text-sev-critical' : 'text-muted-foreground')}>
                  <Clock className="size-3" />
                  {resolved ? 'Closed' : sla === null ? 'SLA pending' : sla <= 0 ? 'SLA breached' : `${sla}h to SLA`}
                </div>
                <div className="text-[11px] text-muted-foreground">{i.upvoteCount} boosts</div>
              </div>
            </Link>
          )
        })}
        {issues.length === 0 && <p className="py-12 text-center text-muted-foreground">No reports yet — <Link to="/report" className="text-teal">report an issue</Link></p>}
      </div>
    </AppShell>
  )
}
