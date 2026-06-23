import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { apiGetThread } from '../lib/api'
import { issueArea, issueImage } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

export function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [thread, setThread] = useState<{ title: string; summary: string; count: number } | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    if (!id) return
    apiGetThread(id).then((r) => {
      setThread(r.thread)
      setIssues(r.issues || [])
    }).catch(() => {})
  }, [id])

  if (!thread) {
    return (
      <AppShell>
        <div className="px-5 py-20 text-center text-muted-foreground">Loading thread…</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex items-center gap-3 px-5 pt-4">
        <Link to="/activity" className="grid size-9 place-items-center rounded-xl border border-glass-border"><ChevronLeft className="size-4" /></Link>
        <div>
          <h1 className="text-lg font-bold">{thread.title}</h1>
          <p className="text-xs text-muted-foreground">{thread.count} related reports</p>
        </div>
      </div>
      <div className="space-y-4 px-5 pt-4">
        <GlassCard>
          <p className="text-sm text-muted-foreground">{thread.summary}</p>
        </GlassCard>
        {issues.map((issue) => (
          <Link key={issue.id} to={`/issues/${issue.id}`} className="glass flex gap-3 p-3">
            <img src={issueImage(issue)} alt="" className="size-14 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{issue.title}</p>
              <p className="text-[11px] text-muted-foreground">{issueArea(issue)} · {issue.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
