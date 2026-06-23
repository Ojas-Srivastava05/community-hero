import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GlassCard, SeverityDot } from '../components/GlassCard'
import { useAuth } from '../lib/auth'
import { apiMyReports } from '../lib/api'
import type { Issue } from '../../../shared/types'

export function MyReportsPage() {
  const { user, signInWithGoogle } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    user.getIdToken().then((token) =>
      apiMyReports(token).then((r) => setIssues(r.issues)).finally(() => setLoading(false)),
    )
  }, [user])

  if (!user) {
    return (
      <div className="p-6 pb-32 text-center">
        <p className="text-mist mb-4">Sign in to track your reports</p>
        <button type="button" className="btn-primary" onClick={() => signInWithGoogle()}>Sign in with Google</button>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 px-6 py-4">
        <h1 className="text-lg font-semibold">My Reports</h1>
      </header>
      <main className="space-y-3 px-6 pt-4">
        {loading && <p className="text-mist">Loading…</p>}
        {!loading && issues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-mist mb-4">No reports yet</p>
            <Link to="/report" className="btn-primary inline-block px-8">Report an issue</Link>
          </div>
        )}
        {issues.map((issue) => (
          <Link key={issue.id} to={`/issues/${issue.id}`}>
            <GlassCard className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-xs text-mist mt-1">{issue.status}</p>
                </div>
                <SeverityDot level={issue.severity >= 4 ? 'high' : 'medium'} />
              </div>
              {issue.slaDeadline && (
                <p className="mt-2 flex items-center gap-1 text-xs text-teal">
                  <Clock size={12} />
                  SLA {formatDistanceToNow(new Date(issue.slaDeadline), { addSuffix: true })}
                </p>
              )}
            </GlassCard>
          </Link>
        ))}
      </main>
    </div>
  )
}
