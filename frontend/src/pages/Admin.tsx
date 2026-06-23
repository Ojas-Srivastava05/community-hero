import { useEffect, useState } from 'react'
import { apiListIssues, apiUpdateStatus } from '../lib/api'
import { useAuth } from '../lib/auth'
import { GlassCard } from '@/components/civic/GlassCard'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import type { Issue } from '../../../shared/types'

const STATUSES = ['Submitted', 'Community Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed']

export function AdminPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState('open')

  const load = () => apiListIssues(100).then((r) => setIssues(r.issues))

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    if (!user) return
    const token = await user.getIdToken()
    await apiUpdateStatus(id, status, token)
    load()
  }

  const displayed = issues.filter((i) =>
    filter === 'open' ? !['Resolved', 'Closed'].includes(i.status) : true,
  )

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="px-5 py-16 text-center">
          <p className="mb-4 text-muted-foreground">Admin sign-in required</p>
          <button type="button" className="rounded-2xl bg-teal px-8 py-3 text-sm font-bold text-primary-foreground teal-glow" disabled={signingIn} onClick={() => signInWithGoogle()}>
            {signingIn ? 'Opening Google…' : 'Sign in'}
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Admin panel" subtitle="SLA queue · status updates" />
      <main className="space-y-3 px-5 pt-4">
        <div className="flex gap-2">
          {['open', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? 'bg-teal text-primary-foreground' : 'glass'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {displayed.map((issue) => (
          <GlassCard key={issue.id} className="space-y-2">
            <p className="text-sm font-medium">{issue.title}</p>
            <p className="text-xs text-muted-foreground">{issue.category} · severity {issue.severity}</p>
            <p className="text-xs">Status: <span className="text-teal">{issue.status}</span></p>
            <select className="w-full rounded-lg border border-glass-border bg-glass p-2 text-xs" value={issue.status} onChange={(e) => updateStatus(issue.id, e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </GlassCard>
        ))}
      </main>
    </AppShell>
  )
}
