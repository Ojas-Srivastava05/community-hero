import { useEffect, useState } from 'react'
import { apiListIssues, apiUpdateStatus } from '../lib/api'
import { useAuth } from '../lib/auth'
import { GlassCard } from '../components/GlassCard'
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
      <div className="p-6 pb-32 text-center">
        <p className="text-mist mb-4">Admin sign-in required</p>
        <button type="button" className="btn-primary" disabled={signingIn} onClick={() => signInWithGoogle()}>
          {signingIn ? 'Opening Google…' : 'Sign in'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 px-6 py-4">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        <p className="text-xs text-mist">SLA queue · status updates · ward routing</p>
      </header>
      <main className="space-y-3 px-6 pt-4">
        <div className="flex gap-2">
          {['open', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${filter === f ? 'bg-teal text-midnight' : 'glass'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {displayed.map((issue) => (
          <GlassCard key={issue.id} className="p-4 space-y-2">
            <p className="font-medium text-sm">{issue.title}</p>
            <p className="text-xs text-mist">{issue.category} · severity {issue.severity} · {issue.departmentId}</p>
            <p className="text-xs">Status: <span className="text-teal">{issue.status}</span></p>
            <select
              className="w-full rounded-lg bg-elevated p-2 text-xs"
              value={issue.status}
              onChange={(e) => updateStatus(issue.id, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </GlassCard>
        ))}
      </main>
    </div>
  )
}
