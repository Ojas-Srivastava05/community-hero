import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiListIssues, apiUpdateStatus } from '../lib/api'
import { useAuth } from '../lib/auth'
import { GlassCard } from '@/components/civic/GlassCard'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { fadeUp, stagger } from '../lib/motion'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import type { Issue } from '../../../shared/types'

const STATUSES = ['Submitted', 'Community Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed']

function needsProof(status: string) {
  return status === 'Resolved' || status === 'Closed'
}

export function AdminPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState('open')
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({})

  const load = () => apiListIssues(100, { includeDemo: true }).then((r) => setIssues(r.issues))

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

  const displayed = issues.filter((i) =>
    filter === 'open' ? !['Resolved', 'Closed'].includes(i.status) : true,
  )

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

  return (
    <AppShell>
      <PageHeader
        title="Admin panel"
        subtitle="SLA queue · status updates"
        right={<Link to="/admin/analytics" className="text-xs font-bold text-coral">Analytics</Link>}
      />
      <main className="space-y-3 px-5 pt-4">
        <div className="flex gap-2">
          {['open', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? 'bg-coral text-paper' : 'paper'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {displayed.map((issue) => {
            const pending = pendingStatus[issue.id]
            const showProof = pending && needsProof(pending)
            return (
              <motion.div key={issue.id} variants={fadeUp}>
                <GlassCard className="space-y-2">
                  <p className="text-sm font-medium text-ink">{issue.title}</p>
                  <p className="text-xs text-ink-muted">{issue.category} · severity {issue.severity}</p>
                  <p className="text-xs text-ink">Status: <span className="text-coral">{issue.status}</span></p>
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
