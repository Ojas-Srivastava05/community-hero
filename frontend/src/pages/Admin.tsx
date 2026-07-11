import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Camera, Download, HelpCircle, Scale } from 'lucide-react'
import { apiApproveIssue, apiListIssues, apiUpdateStatus, apiVerifyResolution } from '../lib/api'
import { useRequireAdmin } from '../lib/admin'
import { useAdminRegion, ADMIN_REGIONS } from '../lib/admin-region'
import { useI18n } from '../lib/i18n'
import { AdminShell } from '@/components/layout/AdminShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { PageSkeleton } from '@/components/PageSkeleton'
import { ResolutionVerificationBadge } from '@/components/civic/ResolutionVerificationBadge'
import { RoleOnboardingModal, dismissOnboarding } from '@/components/civic/RoleOnboardingModal'
import { fadeUp, stagger } from '../lib/motion'
import { slaHoursLeft } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'
import type { ProofComparison } from '../lib/shared-constants'

type QueueTab = 'judge' | 'dispatch' | 'urgent' | 'active' | 'done' | 'all'

function fmt(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template)
}

function fifoSort(a: Issue, b: Issue) {
  return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
}

function issueConfidence(issue: Issue): number | null {
  const analysis = issue.aiMetadata?.analysis as { confidence?: number } | undefined
  if (typeof analysis?.confidence === 'number') return Math.round(analysis.confidence * 100)
  if (typeof issue.aiMetadata?.confidence === 'number') {
    return Math.round((issue.aiMetadata.confidence as number) * 100)
  }
  return null
}

function issueCoverUrl(issue: Issue): string | undefined {
  return issue.imageUrls?.[0] || undefined
}

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

const TABS: { id: QueueTab; labelKey: string; hintKey: string }[] = [
  { id: 'judge', labelKey: 'admin.tab.judge', hintKey: 'admin.tab.judgeHint' },
  { id: 'dispatch', labelKey: 'admin.tab.dispatch', hintKey: 'admin.tab.dispatchHint' },
  { id: 'urgent', labelKey: 'admin.tab.urgent', hintKey: 'admin.tab.urgentHint' },
  { id: 'active', labelKey: 'admin.tab.active', hintKey: 'admin.tab.activeHint' },
  { id: 'done', labelKey: 'admin.tab.done', hintKey: 'admin.tab.doneHint' },
  { id: 'all', labelKey: 'admin.tab.all', hintKey: 'admin.tab.allHint' },
]

export function AdminPage() {
  const { user, loading, isAdmin, accessDenied, signInWithGoogle, signInWithDemo, signingIn } =
    useRequireAdmin('/dashboard', { redirect: false })
  const { t } = useI18n()
  const { matchesIssue, regionId, setRegionId, wardPrefix } = useAdminRegion()
  const [issues, setIssues] = useState<Issue[]>([])
  const [tab, setTab] = useState<QueueTab>('dispatch')
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [proofPreview, setProofPreview] = useState<Record<string, ProofComparison>>({})
  const [proofFor, setProofFor] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  const load = () =>
    apiListIssues(200, {
      includeDemo: true,
      includeDraft: true,
      sortFifo: true,
    }).then((r) => setIssues(r.issues))

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, regionId])

  const regionIssues = useMemo(() => issues.filter((i) => matchesIssue(i)), [issues, matchesIssue])

  const counts = useMemo(
    () => ({
      judge: regionIssues.filter(isJudgeReview).length,
      dispatch: regionIssues.filter((i) => ['Submitted', 'Community Verified'].includes(i.status)).length,
      urgent: regionIssues.filter((i) => i.slaBreached && !['Resolved', 'Closed', 'Draft'].includes(i.status)).length,
      active: regionIssues.filter((i) => ['Assigned', 'In Progress'].includes(i.status)).length,
      done: regionIssues.filter((i) => ['Resolved', 'Closed'].includes(i.status)).length,
    }),
    [regionIssues],
  )

  const displayed = useMemo(() => {
    const list = regionIssues.filter((i) => {
      if (tab === 'judge') return isJudgeReview(i)
      if (tab === 'dispatch') return ['Submitted', 'Community Verified'].includes(i.status)
      if (tab === 'urgent') return i.slaBreached && !['Resolved', 'Closed', 'Draft'].includes(i.status)
      if (tab === 'active') return ['Assigned', 'In Progress'].includes(i.status)
      if (tab === 'done') return ['Resolved', 'Closed'].includes(i.status)
      return true
    })
    return [...list].sort(fifoSort)
  }, [regionIssues, tab])

  const nextPriority = useMemo(() => {
    return (
      regionIssues
        .filter((i) => !['Resolved', 'Closed', 'Draft'].includes(i.status))
        .sort((a, b) => {
          if (a.slaBreached !== b.slaBreached) return a.slaBreached ? -1 : 1
          return (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
        })[0] ?? null
    )
  }, [regionIssues])

  const regionLabel = t(ADMIN_REGIONS.find((r) => r.id === regionId)?.labelKey ?? 'admin.region.all')

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
      <AdminShell title={t('admin.queue.title')} subtitle={t('common.loading')}>
        <PageSkeleton rows={5} />
      </AdminShell>
    )
  }

  if (!user) {
    return (
      <AdminShell title={t('admin.signIn.title')} showRegionPicker={false}>
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">{t('admin.signIn.hint')}</p>
          <button
            type="button"
            className="w-full rounded-2xl bg-indigo py-4 text-sm font-bold text-paper"
            disabled={signingIn}
            onClick={() => signInWithDemo('admin')}
          >
            {signingIn ? t('admin.signIn.signingIn') : t('admin.signIn.demo')}
          </button>
          <button
            type="button"
            className="w-full rounded-2xl border border-rule py-3 text-sm font-bold text-ink"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
          >
            {t('admin.signIn.google')}
          </button>
        </div>
      </AdminShell>
    )
  }

  if (!isAdmin || accessDenied) {
    return (
      <AdminShell title={t('admin.accessDenied.title')} showRegionPicker={false}>
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-ink-muted">{t('admin.accessDenied.hint')}</p>
          <button
            type="button"
            className="rounded-2xl bg-indigo px-8 py-3 text-sm font-bold text-paper disabled:opacity-60"
            disabled={signingIn}
            onClick={async () => {
              await signInWithDemo('admin')
            }}
          >
            {signingIn ? t('admin.accessDenied.switching') : t('admin.accessDenied.switch')}
          </button>
        </div>
      </AdminShell>
    )
  }

  return (
    <>
    <RoleOnboardingModal
      open={guideOpen}
      role="admin"
      onClose={() => setGuideOpen(false)}
      adminRegionId={regionId}
      onAdminRegionChange={setRegionId}
    />
    <AdminShell
      title={t('admin.queue.title')}
      subtitle={fmt(t('admin.queue.subtitle'), {
        new: counts.dispatch,
        urgent: counts.urgent,
        judge: counts.judge,
      })}
      right={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              dismissOnboarding('admin')
              localStorage.removeItem('ch-onboarding-dismissed-admin')
              setGuideOpen(true)
            }}
            className="flex items-center gap-1 rounded-full border border-paper/20 px-2 py-1 text-[10px] font-bold text-paper/80"
            title={t('admin.help.replay')}
          >
            <HelpCircle className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => exportCsv(displayed)}
            className="flex items-center gap-1 rounded-full border border-paper/20 px-2.5 py-1 text-[10px] font-bold text-paper/80"
          >
            <Download className="size-3" /> {t('admin.queue.csv')}
          </button>
        </div>
      }
    >
      {wardPrefix ? (
        <p className="mb-3 text-[11px] font-semibold text-indigo">
          {fmt(t('admin.queue.regionHint'), { region: regionLabel })}
        </p>
      ) : null}
      {nextPriority && (
        <GlassCard className="mb-4 border border-indigo/25 bg-indigo-soft/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo">{t('admin.queue.highestPriority')}</p>
          <p className="mt-1 text-sm font-bold text-ink">{nextPriority.title}</p>
          <p className="text-[11px] text-ink-muted">
            {nextPriority.category.replace(/_/g, ' ')} · priority {nextPriority.priorityScore ?? '—'}
            {nextPriority.slaBreached ? ` · ${t('admin.action.slaBreach')}` : ''}
          </p>
          <Link to={`/issues/${nextPriority.id}`} className="mt-2 inline-block text-xs font-bold text-indigo">
            {t('admin.queue.openTicket')}
          </Link>
        </GlassCard>
      )}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.id}
            type="button"
            onClick={() => setTab(tabDef.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === tabDef.id ? 'bg-indigo text-paper' : 'border border-rule bg-paper text-ink'
            }`}
          >
            {t(tabDef.labelKey)}
            {tabDef.id !== 'all' && counts[tabDef.id as keyof typeof counts] > 0 && (
              <span className="ml-1 opacity-80">({counts[tabDef.id as keyof typeof counts]})</span>
            )}
          </button>
        ))}
      </div>
      <p className="mb-1 text-[11px] text-ink-muted">{t(TABS.find((tb) => tb.id === tab)?.hintKey ?? '')}</p>
      <p className="mb-3 text-[10px] text-ink-muted">{t('admin.queue.fifoNote')}</p>

      {displayed.length === 0 ? (
        <GlassCard className="space-y-2 text-center text-sm text-ink-muted">
          <p>{t('admin.queue.empty')}</p>
          {tab === 'dispatch' && counts.judge > 0 && (
            <p className="text-xs text-amber">
              {counts.judge} report(s) waiting in <button type="button" className="font-bold underline" onClick={() => setTab('judge')}>Judge</button> (AI review / Draft)
            </p>
          )}
          {regionId !== 'all' && (
            <p className="text-xs">
              Try <button type="button" className="font-bold underline" onClick={() => setRegionId('all')}>All India</button> if a live report is missing
            </p>
          )}
        </GlassCard>
      ) : (
        <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {displayed.map((issue) => {
            const judge = isJudgeReview(issue)
            const confidence = issueConfidence(issue)
            const coverUrl = issueCoverUrl(issue)
            const showProof = proofFor === issue.id

            return (
              <motion.li key={issue.id} variants={fadeUp}>
                <GlassCard
                  className={`overflow-hidden p-0 ${issue.slaBreached ? 'border border-coral/40' : ''} ${judge ? 'border border-amber/40' : ''}`}
                >
                  {coverUrl ? (
                    <div className="relative h-40 w-full bg-ink/10">
                      <img
                        src={coverUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="line-clamp-2 text-sm font-bold text-white drop-shadow">{issue.title}</p>
                        <p className="mt-1 text-[11px] text-white/85">
                          {issue.category.replace(/_/g, ' ')} · severity {issue.severity}
                          {confidence != null && ` · ${confidence}% AI`}
                        </p>
                      </div>
                      {judge && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-amber/95 px-2 py-0.5 text-[10px] font-bold text-paper">
                          <Scale className="size-3" /> {t('admin.action.needsJudge')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="border-b border-rule bg-paper/80 px-3 py-3">
                      <p className="text-sm font-bold text-ink">{issue.title}</p>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {issue.category.replace(/_/g, ' ')} · severity {issue.severity}
                        {confidence != null && ` · ${confidence}% AI`}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 p-3">
                  <div>
                    <p className="text-xs">
                      <span className="font-semibold text-indigo">{issue.status}</span>
                      {!coverUrl && judge && (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-amber">
                          <Scale className="size-3" /> {t('admin.action.needsJudge')}
                        </span>
                      )}
                      {issue.slaBreached && (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-bold text-coral">
                          <AlertTriangle className="size-3" /> {t('admin.action.slaBreach')}
                        </span>
                      )}
                      {!issue.slaBreached && slaHoursLeft(issue) != null && !['Resolved', 'Closed'].includes(issue.status) && (
                        <span className="ml-2 text-ink-muted">
                          {fmt(t('admin.action.hoursToSla'), { hours: slaHoursLeft(issue)! })}
                        </span>
                      )}
                    </p>
                    {issue.address && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-ink-muted">{issue.address}</p>
                    )}
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
                          {approvingId === issue.id ? t('admin.action.publishing') : t('admin.action.approve')}
                        </button>
                        <Link
                          to={`/issues/${issue.id}`}
                          className="rounded-lg border border-rule px-3 py-2 text-xs font-bold text-ink"
                        >
                          {t('admin.action.review')}
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
                        {busyId === issue.id ? t('common.loading') : t('admin.action.startWork')}
                      </button>
                    )}
                    {!judge && issue.status === 'Assigned' && (
                      <button
                        type="button"
                        disabled={busyId === issue.id}
                        onClick={() => setStatus(issue.id, 'In Progress')}
                        className="rounded-lg bg-indigo px-3 py-2 text-xs font-bold text-paper disabled:opacity-50"
                      >
                        {t('admin.action.markInProgress')}
                      </button>
                    )}
                    {!judge && issue.status === 'In Progress' && (
                      <button
                        type="button"
                        onClick={() => setProofFor(issue.id)}
                        className="rounded-lg bg-leaf px-3 py-2 text-xs font-bold text-paper"
                      >
                        {t('admin.action.markResolved')}
                      </button>
                    )}
                    <Link
                      to={`/issues/${issue.id}`}
                      className="rounded-lg border border-rule px-3 py-2 text-xs font-bold text-ink"
                    >
                      {t('admin.action.details')}
                    </Link>
                  </div>

                  {showProof && (
                    <div className="space-y-2 rounded-xl border border-leaf/30 bg-leaf-soft/20 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-leaf">
                        <Camera className="size-3.5" /> {t('admin.proof.title')}
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
                        {t('admin.action.confirmResolved')}
                      </button>
                    </div>
                  )}
                  </div>
                </GlassCard>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </AdminShell>
    </>
  )
}
