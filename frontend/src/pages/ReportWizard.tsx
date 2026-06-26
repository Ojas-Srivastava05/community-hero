import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronLeft, Loader2, LogIn, MapPin, RefreshCw, Sparkles, Zap } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { CivicMap } from '@/components/civic/CivicMap'
import { InvalidMediaCard, type InvalidMediaReason } from '@/components/civic/InvalidMediaCard'
import { useAuth } from '../lib/auth'
import { useLocation } from '../lib/location'
import { apiAnalyzeImage, apiCreateReport, apiListIssues } from '../lib/api'
import { preprocessImageForUpload, validateImageFile } from '../lib/image-media'
import { usePointsToast } from '@/components/civic/PointsToast'
import { cn } from '@/lib/utils'
import type { IssueAnalysis, Issue } from '../../../shared/types'

const CATEGORIES = ['pothole', 'water_leak', 'streetlight', 'waste', 'road_damage', 'drainage', 'signage', 'encroachment', 'other']

export function ReportWizardPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const { location, loading: locLoading, refresh } = useLocation()
  const navigate = useNavigate()
  const { showPoints } = usePointsToast()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null)
  const [duplicates, setDuplicates] = useState<{ id: string; title: string }[]>([])
  const [mergeIntoId, setMergeIntoId] = useState<string | undefined>()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'pothole',
    severity: 3,
    lat: 0,
    lng: 0,
    address: '',
  })
  const [error, setError] = useState('')
  const [invalidMedia, setInvalidMedia] = useState<InvalidMediaReason | null>(null)
  const [processingMedia, setProcessingMedia] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const steps = ['Capture', 'Describe', 'Confirm']

  useEffect(() => {
    if (location) {
      setForm((prev) => ({
        ...prev,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      }))
    }
  }, [location])

  const onFile = async (raw: File) => {
    setError('')
    const validation = validateImageFile(raw)
    if (validation !== 'ok') {
      setInvalidMedia(validation)
      setFile(null)
      setPreview(null)
      setAnalysis(null)
      return
    }
    setInvalidMedia(null)
    setProcessingMedia(true)
    let f: File
    try {
      f = await preprocessImageForUpload(raw)
    } catch {
      f = raw
    } finally {
      setProcessingMedia(false)
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    if (!user) return
    setAnalyzing(true)
    try {
      const token = await user.getIdToken()
      const { analysis: a } = await apiAnalyzeImage(f, token)
      setAnalysis(a)
      setForm((prev) => ({ ...prev, title: a.title, description: a.description, category: a.category, severity: a.severity }))
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  const retakePhoto = () => {
    setInvalidMedia(null)
    setFile(null)
    setPreview(null)
    setAnalysis(null)
    if (fileRef.current) fileRef.current.value = ''
    fileRef.current?.click()
  }

  const submit = async () => {
    if (!user || !file || !form.lat) return
    setSubmitting(true)
    setError('')
    try {
      const token = await user.getIdToken()
      const result = await apiCreateReport(
        {
          ...form,
          mergeIntoId,
          ...(analysis
            ? {
                confidence: analysis.confidence,
                safety_risk: analysis.safety_risk,
                department: analysis.department,
              }
            : {}),
        },
        [file],
        token,
      )
      showPoints(mergeIntoId ? 15 : 10, mergeIntoId ? 'Duplicate Hunter' : 'Report submitted')
      navigate(`/issues/${result.id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (step !== 2 || !form.lat || !form.lng) return
    apiListIssues(30, { lat: form.lat, lng: form.lng, radiusKm: 0.3 })
      .then((r) => {
        const near = r.issues
          .filter((i) => i.category === form.category)
          .slice(0, 3)
          .map((i) => ({ id: i.id, title: i.title }))
        setDuplicates(near)
      })
      .catch(() => {})
  }, [step, form.lat, form.lng, form.category])

  const hasLocation: boolean = form.lat !== 0 && form.lng !== 0

  return (
    <AppShell>
      <PageHeader
        title="Report an issue"
        subtitle={`Step ${step + 1} of 3 — ${steps[step]}`}
        right={
          <button type="button" onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))} className="grid size-9 place-items-center rounded-xl border border-rule">
            <ChevronLeft className="size-4 text-ink" />
          </button>
        }
      />
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-coral' : 'bg-rule')} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 pt-5">
          {step === 0 && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-rule bg-surface">
                {preview ? (
                  <img src={preview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 grid place-items-center">
                      <Camera className="size-16 text-ink-muted/40" />
                    </div>
                    <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-coral/40" />
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </div>
              <GlassCard className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-coral" />
                <p className="text-xs text-ink-muted">AI auto-detects category, severity, and drafts your report at your current location.</p>
              </GlassCard>
              {invalidMedia && (
                <InvalidMediaCard reason={invalidMedia} onRetake={retakePhoto} />
              )}
              {!user ? (
                <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                  <LogIn className="size-4" /> {signingIn ? 'Opening Google…' : 'Sign in to submit'}
                </button>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="grid w-full place-items-center rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                  <span className="flex items-center gap-2"><Camera className="size-4" /> {preview ? 'Retake photo' : 'Capture photo'}</span>
                </button>
              )}
              {processingMedia && <p className="flex items-center justify-center gap-2 text-sm text-ink-muted"><Loader2 className="size-4 animate-spin" /> Optimizing photo…</p>}
              {analyzing && <p className="flex items-center justify-center gap-2 text-sm text-coral"><Loader2 className="size-4 animate-spin" /> Analyzing…</p>}
              {file && user && (
                <button type="button" disabled={!hasLocation && locLoading} onClick={() => setStep(1)} className="w-full py-2 text-xs font-semibold text-coral disabled:opacity-40">
                  {locLoading ? 'Getting your location…' : 'Continue →'}
                </button>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              {analysis && (
                <GlassCard className="border-coral/30 bg-coral-soft/30">
                  <div className="flex items-center gap-2"><Zap className="size-4 text-coral" /><p className="text-xs font-bold uppercase tracking-wider text-coral">AI detected</p></div>
                  <p className="mt-2 text-sm text-ink">{form.description}</p>
                </GlassCard>
              )}
              <div>
                <label className="text-xs font-semibold text-ink-muted">Title</label>
                <input className="mt-2 w-full rounded-2xl border border-rule bg-paper p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-coral/30" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-muted">Description</label>
                <textarea rows={4} className="mt-2 w-full rounded-2xl border border-rule bg-paper p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-coral/30" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-muted">Category</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, category: c })} className={cn('chip transition-colors', form.category === c && 'bg-coral-soft text-coral border-coral/30')}>
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="grid w-full place-items-center rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-muted">Location</p>
                  <button type="button" onClick={() => refresh()} className="flex items-center gap-1 text-[11px] font-semibold text-coral">
                    <RefreshCw className="size-3" /> Refresh GPS
                  </button>
                </div>
                <p className="mt-1 text-sm font-bold text-ink">{form.address || 'Getting address…'}</p>
                <p className="text-[11px] text-ink-muted">{hasLocation ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : 'Waiting for location…'}</p>
                <div className="mt-3 flex items-center gap-2"><MapPin className="size-4 text-coral" /><Chip tone="coral">Your location</Chip></div>
              </GlassCard>
              {hasLocation && (
                <div className="h-40 overflow-hidden rounded-2xl border border-rule">
                  <CivicMap
                    center={{ lat: form.lat, lng: form.lng }}
                    issues={[{
                      id: 'draft',
                      title: form.title,
                      description: form.description,
                      category: form.category as Issue['category'],
                      severity: form.severity,
                      status: 'Draft',
                      lat: form.lat,
                      lng: form.lng,
                      address: form.address,
                      imageUrls: [],
                      reporterId: '',
                      upvoteCount: 0,
                      verificationLevel: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }]}
                    zoom={16}
                    className="size-full"
                  />
                </div>
              )}
              {duplicates.length > 0 && (
                <GlassCard className="border-amber/30 bg-amber-soft/30">
                  <p className="text-xs font-bold text-amber">Similar reports nearby</p>
                  <p className="mt-1 text-[11px] text-ink-muted">Merge into an existing issue instead of creating a duplicate?</p>
                  <div className="mt-3 space-y-2">
                    {duplicates.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setMergeIntoId(mergeIntoId === d.id ? undefined : d.id)}
                        className={cn('w-full rounded-xl border px-3 py-2 text-left text-sm', mergeIntoId === d.id ? 'border-coral bg-coral-soft text-coral' : 'border-rule text-ink')}
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}
              <button type="button" disabled={submitting || !hasLocation} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow disabled:opacity-50">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {mergeIntoId ? 'Merge into existing report' : 'Submit report'}
              </button>
            </div>
          )}
          {error && <p className="mt-4 rounded-xl border border-sev-critical/30 bg-sev-critical/10 px-4 py-3 text-sm text-sev-critical">{error}</p>}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}
