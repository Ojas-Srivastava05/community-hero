import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Camera, Download, Scale } from 'lucide-react'
import { apiApproveIssue, apiListIssues, apiUpdateStatus, apiVerifyResolution } from '../lib/api'
import { useRequireAdmin } from '../lib/admin'
import { AdminShell } from '@/components/layout/AdminShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { PageSkeleton } from '@/components/PageSkeleton'
import { ResolutionVerificationBadge } from '@/components/civic/ResolutionVerificationBadge'
import { fadeUp, stagger } from '../lib/motion'
import { slaHoursLeft } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'
import type { ProofComparison } from '../lib/shared-constants'

type QueueTab = 'judge' | 'dispatch' | 'urgent' | 'active' | 'done' | 'all'

function isJudgeReview(issue: Issue): boolean {
  return issue.status === 'Draft' || issue.aiMetadata?.needs_review === true
}

function exportCsv(issues: Issue[]) {
  const headers = ['id', 'title', 'category', 'severity', 'status', 'priorityScore', 'slaBreached', 'departmentId', 'createdAt']
  const rows = issues.map((i) =>
    headers.map((h) => {
      const val = i[h as keyof Issue]
      const str = val === undefined || val === null ? '' : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(','),
  )
  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `community-hero-issues-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const TABS: { id: QueueTab; label: string; hint: string }[] = [
  { id: 'judge', label: 'Judge', hint: 'Low-confidence — approve or reject' },
  { id: 'dispatch', label: 'New', hint: 'Submitted & verified — assign work' },
  { id: 'urgent', label: 'SLA breach', hint: 'Past deadline — act now' },
  { id: 'active', label: 'In progress', hint: 'Assigned or being fixed' },
  { id: 'done', label: 'Resolved', hint: 'Closed loop' },
  { id: 'all', label: 'All', hint: 'Full list' },
]

export function AdminPage() {
  const { user, loading, isAdmin, accessDenied, signInWithGoogle, signInWithDemo, signingIn } =
    useRequireAdmin('/dashboard', { redirect: false })
  const [issues, setIssues] = useState<Issue[]>([])
  const [tab, setTab] = useState<QueueTab>('dispatch')
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [proofPreview, setProofPreview] = useState<Record<string, ProofComparison>>({})
  const [proofFor, setProofFor] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () =>
    apiListIssues(100, { includeDemo: true, includeDraft: true, sortByPriority: true }).then((r) =>
      setIssues(r.issues),
    )

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  const counts = useMemo(
    () => ({
      judge: issues.filter(isJudgeReview).length,
      dispatch: issues.filter((i) => ['Submitted', 'Community Verified'].includes(i.status)).length,
      urgent: issues.filter((i) => i.slaBreached && !['Resolved', 'Closed', 'Draft'].includes(i.status)).length,
      active: issues.filter((i) => ['Assigned', 'In Progress'].includes(i.status)).length,
      done: issues.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length,
    }),
    [issues],
  )

  const displayed = useMemo(() => {
    const list = issues.filter((i) => {
      if (tab === 'judge') return isJudgeReview(i)
      if (tab === 'dispatch') return ['Submitted', 'Community Verified'].includes(i.status)
      if (tab === 'urgent') return i.slaBreached && !['Resolved', 'Closed', 'Draft'].includes(i.status)
      if (tab === 'active') return ['Assigned', 'In Progress'].includes(i.status)
      if (tab === 'done') return ['Resolved', 'Closed'].includes(i.status)
      return true
    })
    return [...list].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
  }, [issues, tab])

  const nextPriority = useMemo(() => {
    return (
      issues
        .filter((i) => !['Resolved', 'Closed', 'Draft'].includes(i.status))
        .sort((a, b) => {
          if (a.slaBreached !== b.slaBreached) return a.slaBreached ? -1 : 1
          return (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
        })[0] ?? null
    )
  }, [issues])

  const setStatus = async (id: string, status: string, proof?: File) => {
    if (!user) return
    setBusyId(id)
    try {
      const token = await user.getIdToken()
      await apiUpdateStatus(id, status, token, proof)
      setProofFor(null)
      setProofFiles((p) => {
        const n = { ...p }
        delete n[id]
        return n
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const approveIssue = async (id: string) => {
    if (!user) return
    setApprovingId(id)
    try {
      const token = await user.getIdToken()
      await apiApproveIssue(id, token)
      await load()
    } finally {
      setApprovingId(null)
    }
  }

  if (loading) {
    return (
      <AdminShell title="Operations queue" subtitle="Loading…">
        <PageSkeleton rows={5} />
      </AdminShell>
    )
  }

  if (!user) {
    return (
      <AdminShell title="Authority sign-in">
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">Municipal operators only — not the citizen report flow.</p>
          <button
            type="button"
            className="w-full rounded-2xl bg-indigo py-4 text-sm font-bold text-paper"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            {signingIn ? 'Signing in…' : 'Enter as demo authority'}
          </button>
          <button
            type="button"
            className="w-full rounded-2xl border border-rule py-3 text-sm font-bold text-ink"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
          >
            Sign in with Google
          </button>
        </div>
      </AdminShell>
    )
  }

  if (!isAdmin || accessDenied) {
    return (
      <AdminShell title="Access denied">
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">This console requires admin privileges.</p>
          <button
            type="button"
            className="rounded-2xl bg-indigo px-8 py-3 text-sm font-bold text-paper"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            Switch to demo authority
          </button>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Operations queue"
      subtitle={`${counts.dispatch} new · ${counts.urgent} SLA breach · ${counts.judge} judge`}
      right={
        <button
          type="button"
          onClick={() => exportCsv(displayed)}
          className="flex items-center gap-1 rounded-full border border-paper/20 px-2.5 py-1 text-[10px] font-bold text-paper/80"
        >
          <Download className="size-3" /> CSV
        </button>
      }
    >
      {nextPriority && (
        <GlassCard className="mb-4 border border-indigo/25 bg-indigo-soft/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo">Highest priority</p>
          <p className="mt-1 text-sm font-bold text-ink">{nextPriority.title}</p>
          <p className="text-[11px] text-ink-muted">
            {nextPriority.category.replace(/_/g, ' ')} · priority {nextPriority.priorityScore ?? '—'}
            {nextPriority.slaBreached ? ' · SLA breached' : ''}
          </p>
          <Link to={`/issues/${nextPriority.id}`} className="mt-2 inline-block text-xs font-bold text-indigo">
            Open ticket →
          </Link>
        </GlassCard>
      )}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? 'bg-indigo text-paper' : 'border border-rule bg-paper text-ink'
            }`}
          >
            {t.label}
            {t.id !== 'all' && counts[t.id as keyof typeof counts] > 0 && (
              <span className="ml-1 opacity-80">({counts[t.id as keyof typeof counts]})</span>
            )}
          </button>
        ))}
      </div>
      <p className="mb-3 text-[11px] text-ink-muted">{TABS.find((t) => t.id === tab)?.hint}</p>

      {displayed.length === 0 ? (
        <GlassCard className="text-center text-sm text-ink-muted">No tickets in this queue.</GlassCard>
      ) : (
        <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {displayed.map((issue) => {
            const judge = isJudgeReview(issue)
            const confidence =
              typeof issue.aiMetadata?.confidence === 'number'
                ? Math.round((issue.aiMetadata.confidence as number) * 100)
                : null
            const showProof = proofFor === issue.id

            return (
              <motion.li key={issue.id} variants={fadeUp}>
                <GlassCard
                  className={`space-y-3 ${issue.slaBreached ? 'border border-coral/40' : ''} ${judge ? 'border border-amber/40 bg-amber-soft/20' : ''}`}
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{issue.title}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {issue.category.replace(/_/g, ' ')} · severity {issue.severity}
                      {issue.priorityScore != null && ` · priority ${issue.priorityScore}`}
                      {confidence != null && ` · ${confidence}% AI`}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="font-semibold text-indigo">{issue.status}</span>
                      {judge && (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-amber">
                          <Scale className="size-3" /> Needs judge
                        </span>
                      )}
                      {issue.slaBreached && (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-coral">
                          <AlertTriangle className="size-3" /> SLA breach
                        </span>
                      )}
                      {!issue.slaBreached && slaHoursLeft(issue) != null && !['Resolved', 'Closed'].includes(issue.status) && (
                        <span className="ml-2 text-ink-muted">{slaHoursLeft(issue)}h to SLA</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {judge && (
                      <>
                        <button
                          type="button"
                          disabled={approvingId === issue.id}
                          onClick={() => approveIssue(issue.id)}
                          className="rounded-lg bg-coral px-3 py-2 text-xs font-bold text-paper disabled:opacity-50"
                        >
                          {approvingId === issue.id ? 'Publishing…' : 'Approve & publish'}
                        </button>
                        <Link
                          to={`/issues/${issue.id}`}
                          className="rounded-lg border border-rule px-3 py-2 text-xs font-bold text-ink"
                        >
                          Review
                        </Link>
                      </>
                    )}
                    {!judge && ['Submitted', 'Community Verified'].includes(issue.status) && (
                      <button
                        type="button"
                        disabled={busyId === issue.id}
                        onClick={() => setStatus(issue.id, 'In Progress')}
                        className="rounded-lg bg-indigo px-3 py-2 text-xs font-bold text-paper disabled:opacity-50"
                      >
                        Start work
                      </button>
                    )}
                    {!judge && issue.status === 'Assigned' && (
                      <button
                        type="button"
                        disabled={busyId === issue.id}
                        onClick={() => setStatus(issue.id, 'In Progress')}
                        className="rounded-lg bg-indigo px-3 py-2 text-xs font-bold text-paper disabled:opacity-50"
                      >
                        Mark in progress
                      </button>
                    )}
                    {!judge && issue.status === 'In Progress' && (
                      <button
                        type="button"
                        onClick={() => setProofFor(issue.id)}
                        className="rounded-lg bg-leaf px-3 py-2 text-xs font-bold text-paper"
                      >
                        Mark resolved
                      </button>
                    )}
                    <Link
                      to={`/issues/${issue.id}`}
                      className="rounded-lg border border-rule px-3 py-2 text-xs font-bold text-ink"
                    >
                      Details
                    </Link>
                  </div>

                  {showProof && (
                    <div className="space-y-2 rounded-xl border border-leaf/30 bg-leaf-soft/20 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-leaf">
                        <Camera className="size-3.5" /> Upload after photo to close ticket
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-xs"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f || !user) return
                          setProofFiles((p) => ({ ...p, [issue.id]: f }))
                          try {
                            const token = await user.getIdToken()
                            const { comparison } = await apiVerifyResolution(issue.id, f, token)
                            setProofPreview((p) => ({ ...p, [issue.id]: comparison }))
                          } catch {
                            setProofPreview((p) => {
                              const n = { ...p }
                              delete n[issue.id]
                              return n
                            })
                          }
                        }}
                      />
                      {proofPreview[issue.id] && (
                        <ResolutionVerificationBadge comparison={proofPreview[issue.id]} />
                      )}
                      <button
                        type="button"
                        disabled={!proofFiles[issue.id] || busyId === issue.id}
                        onClick={() => setStatus(issue.id, 'Resolved', proofFiles[issue.id])}
                        className="w-full rounded-lg bg-leaf py-2 text-xs font-bold text-paper disabled:opacity-40"
                      >
                        Confirm resolved
                      </button>
                    </div>
                  )}
                </GlassCard>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </AdminShell>
  )
}
