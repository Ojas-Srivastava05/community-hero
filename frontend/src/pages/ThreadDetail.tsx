import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { apiGetThread } from '../lib/api'
import { issueArea, issueImage } from '@/lib/issue-ui'
import { fadeUp, stagger } from '../lib/motion'
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
        <div className="px-5 py-20 text-center text-ink-muted">Loading thread…</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex items-center gap-3 px-5 pt-4">
        <Link to="/activity" className="grid size-9 place-items-center rounded-xl border border-rule"><ChevronLeft className="size-4 text-ink" /></Link>
        <div>
          <h1 className="display text-lg font-bold text-ink">{thread.title}</h1>
          <p className="text-xs text-ink-muted">{thread.count} related reports</p>
        </div>
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-5 pt-4">
        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-coral" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Gemini AI summary</p>
            </div>
            <p className="text-sm leading-relaxed text-ink">{thread.summary}</p>
          </GlassCard>
        </motion.div>
        {issues.map((issue) => (
          <motion.div key={issue.id} variants={fadeUp}>
            <Link to={`/issues/${issue.id}`} className="paper flex gap-3 p-3 transition-transform active:scale-[0.99]">
              <img src={issueImage(issue)} alt={`${issue.title} — ${issue.status}`} className="size-14 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{issue.title}</p>
                <p className="text-[11px] text-ink-muted">
                  {issueArea(issue)} · {issue.status}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </AppShell>
  )
}
