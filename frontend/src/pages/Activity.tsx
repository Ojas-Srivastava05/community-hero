import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageSquare } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { apiListIssues } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '../../../shared/types'

export function ActivityPage() {
  const [recent, setRecent] = useState<Issue[]>([])

  useEffect(() => {
    apiListIssues(15).then((r) => setRecent(r.issues)).catch(() => {})
  }, [])

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 px-6 py-4">
        <h1 className="text-lg font-semibold">Activity</h1>
        <p className="text-xs text-mist">Community updates & notifications</p>
      </header>
      <main className="space-y-4 px-6 pt-4">
        <Link to="/assistant" className="btn-primary flex items-center justify-center gap-2">
          <MessageSquare size={18} />
          Ask Civic Assistant
        </Link>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Bell size={16} className="text-teal" />
            Recent community activity
          </h2>
          {recent.map((issue) => (
            <Link key={issue.id} to={`/issues/${issue.id}`}>
              <GlassCard className="mb-2 p-3">
                <p className="text-sm font-medium">{issue.title}</p>
                <p className="text-xs text-mist mt-1">
                  {issue.status} · {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </p>
              </GlassCard>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
