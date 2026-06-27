import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiBulkUpdateStatus, apiListIssues, apiUpdateStatus } from '../lib/api'
import { useRequireAdmin } from '../lib/admin'
import { GlassCard } from '@/components/civic/GlassCard'
import { PageSkeleton } from '@/components/PageSkeleton'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { fadeUp, stagger } from '../lib/motion'
import { motion } from 'framer-motion'
import { AlertTriangle, Camera, Download } from 'lucide-react'
import { slaHoursLeft } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

const STATUSES = ['Submitted', 'Community Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed']

function needsProof(status: string) {
  return status === 'Resolved' || status === 'Closed'
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
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `community-hero-issues-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminPage() {
  const { user, loading, isAdmin, accessDenied, signInWithGoogle, signingIn } = useRequireAdmin()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState('open')
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('In Progress')

  const load = () =>
    apiListIssues(100, { includeDemo: true, sortByPriority: true }).then((r) => setIssues(r.issues))

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, status: string, proof?: File) => {
    if (!user) return
    const token = await user.getIdToken()
    await apiUpdateStatus(id, status, token, proof)
    setPendingStatus((p) => {
      const next = { ...p }
      delete next[id]
      return next
    })
    setProofFiles((p) => {
      const next = { ...p }
      delete next[id]
      return next
    })
    load()
  }

  const onStatusSelect = (issue: Issue, status: string) => {
    if (needsProof(status)) {
      setPendingStatus((p) => ({ ...p, [issue.id]: status }))
      return
    }
    updateStatus(issue.id, status)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runBulkUpdate = async () => {
    if (!user || selected.size === 0) return
    const token = await user.getIdToken()
    await apiBulkUpdateStatus([...selected], bulkStatus, token)
    setSelected(new Set())
    load()
  }

  const displayed = useMemo(() => {
    const filtered = issues.filter((i) => {
      if (filter === 'breached') return Boolean(i.slaBreached) && !['Resolved', 'Closed'].includes(i.status)
      if (filter === 'open') return !['Resolved', 'Closed'].includes(i.status)
      return true
    })
    return [...filtered].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
  }, [issues, filter])

  const breachCount = useMemo(
    () => issues.filter((i) => i.slaBreached && !['Resolved', 'Closed'].includes(i.status)).length,
    [issues],
  )

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Admin" subtitle="Loading…" />
        <PageSkeleton rows={5} />
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Admin" />
        <div className="px-5 py-16 text-center">
          <p className="mb-4 text-ink-muted">Admin sign-in required</p>
          <button type="button" className="rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow" disabled={signingIn} onClick={() => signInWithGoogle()}>
            {signingIn ? 'Opening Google…' : 'Sign in'}
          </button>
        </div>
      </AppShell>
    )
  }

  if (!isAdmin) {
    if (accessDenied) {
      return (
        <AppShell>
          <PageHeader title="Admin" subtitle="Access denied" />
          <div className="px-5 py-16 text-center text-ink-muted">
            <p>Admin privileges required.</p>
          </div>
        </AppShell>
      )
    }
    return null
  }

  return (
    <AppShell>
      <PageHeader
        title="Admin panel"
        subtitle={`SLA queue · ${breachCount} breached`}
        right={<Link to="/admin/analytics" className="text-xs font-bold text-coral">Analytics</Link>}
      />
      <main className="space-y-3 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {['open', 'breached', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? 'bg-coral text-paper' : 'paper'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'breached' ? `breached (${breachCount})` : f}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto flex items-center gap-1 rounded-full border border-rule px-3 py-1 text-xs font-semibold text-ink"
            onClick={() => exportCsv(displayed)}
          >
            <Download className="size-3" /> Export CSV
          </button>
        </div>

        {selected.size > 0 && (
          <GlassCard className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink">{selected.size} selected</span>
            <select
              className="rounded-lg border border-rule bg-paper px-2 py-1 text-xs"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="rounded-lg bg-coral px-3 py-1 text-xs font-bold text-paper" onClick={runBulkUpdate}>
              Apply bulk
            </button>
          </GlassCard>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {displayed.map((issue) => {
            const pending = pendingStatus[issue.id]
            const showProof = pending && needsProof(pending)
            return (
              <motion.div key={issue.id} variants={fadeUp}>
                <GlassCard className={`space-y-2 ${issue.slaBreached ? 'border border-[oklch(0.5_0.22_25/0.4)]' : ''}`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(issue.id)}
                      onChange={() => toggleSelect(issue.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{issue.title}</p>
                      <p className="text-xs text-ink-muted">
                        {issue.category} · severity {issue.severity}
                        {issue.priorityScore != null && ` · priority ${issue.priorityScore}`}
                      </p>
                      <p className="text-xs text-ink">
                        Status: <span className="text-coral">{issue.status}</span>
                        {issue.slaBreached && (
                          <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-[oklch(0.5_0.22_25)]">
                            <AlertTriangle className="size-3" /> SLA breached
                          </span>
                        )}
                        {!issue.slaBreached && slaHoursLeft(issue) !== null && !['Resolved', 'Closed'].includes(issue.status) && (
                          <span className="ml-2 text-ink-muted">· {slaHoursLeft(issue)}h to SLA</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <select
                    className="w-full rounded-lg border border-rule bg-paper p-2 text-xs text-ink"
                    value={pending || issue.status}
                    onChange={(e) => onStatusSelect(issue, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {showProof && (
                    <div className="space-y-2 rounded-xl border border-coral/30 bg-coral-soft/20 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-coral">
                        <Camera className="size-3.5" /> Proof photo required for {pending}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-xs text-ink"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) setProofFiles((p) => ({ ...p, [issue.id]: f }))
                        }}
                      />
                      <button
                        type="button"
                        disabled={!proofFiles[issue.id]}
                        onClick={() => updateStatus(issue.id, pending, proofFiles[issue.id])}
                        className="w-full rounded-lg bg-coral py-2 text-xs font-bold text-paper disabled:opacity-40"
                      >
                        Confirm with proof
                      </button>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      </main>
    </AppShell>
  )
}
