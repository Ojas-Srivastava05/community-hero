import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronLeft, Loader2, LogIn, MapPin, RefreshCw, Sparkles, Zap } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { CivicMap } from '@/components/civic/CivicMap'
import { useAuth } from '../lib/auth'
import { useLocation } from '../lib/location'
import { apiAnalyzeImage, apiCreateReport, apiListIssues } from '../lib/api'
import { cn } from '@/lib/utils'
import type { IssueAnalysis, Issue } from '../../../shared/types'

const CATEGORIES = ['pothole', 'water_leak', 'streetlight', 'waste', 'road_damage', 'drainage', 'signage', 'encroachment', 'other']

export function ReportWizardPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const { location, loading: locLoading, refresh } = useLocation()
  const navigate = useNavigate()
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

  const onFile = async (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    if (!user) return
    setAnalyzing(true)
    setError('')
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

  const submit = async () => {
    if (!user || !file || !form.lat) return
    setSubmitting(true)
    setError('')
    try {
      const token = await user.getIdToken()
      const result = await apiCreateReport({ ...form, mergeIntoId }, [file], token)
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

  const hasLocation = form.lat !== 0 && form.lng !== 0

  return (
    <AppShell>
      <PageHeader
        title="Report an issue"
        subtitle={`Step ${step + 1} of 3 — ${steps[step]}`}
        right={
          <button type="button" onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))} className="grid size-9 place-items-center rounded-xl border border-glass-border">
            <ChevronLeft className="size-4" />
          </button>
        }
      />
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-teal' : 'bg-glass-border')} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 pt-5">
          {step === 0 && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-glass-border bg-[#0a0e13]">
                {preview ? (
                  <img src={preview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 grid place-items-center">
                      <Camera className="size-16 text-muted-foreground/40" />
                    </div>
                    <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-teal/40" />
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </div>
              <GlassCard className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-teal" />
                <p className="text-xs text-muted-foreground">AI auto-detects category, severity, and drafts your report at your current location.</p>
              </GlassCard>
              {!user ? (
                <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-sm font-bold text-primary-foreground teal-glow">
                  <LogIn className="size-4" /> {signingIn ? 'Opening Google…' : 'Sign in to submit'}
                </button>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="grid w-full place-items-center rounded-2xl bg-teal py-4 text-sm font-bold text-primary-foreground teal-glow">
                  <span className="flex items-center gap-2"><Camera className="size-4" /> {preview ? 'Retake photo' : 'Capture photo'}</span>
                </button>
              )}
              {analyzing && <p className="flex items-center justify-center gap-2 text-sm text-teal"><Loader2 className="size-4 animate-spin" /> Analyzing…</p>}
              {file && user && (
                <button type="button" disabled={!hasLocation && locLoading} onClick={() => setStep(1)} className="w-full py-2 text-xs font-semibold text-teal disabled:opacity-40">
                  {locLoading ? 'Getting your location…' : 'Continue →'}
                </button>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              {analysis && (
                <GlassCard className="border-teal/30">
                  <div className="flex items-center gap-2"><Zap className="size-4 text-teal" /><p className="text-xs font-bold uppercase tracking-wider text-teal">AI detected</p></div>
                  <p className="mt-2 text-sm">{form.description}</p>
                </GlassCard>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input className="mt-2 w-full rounded-2xl border border-glass-border bg-glass p-3 text-sm outline-none" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea rows={4} className="mt-2 w-full rounded-2xl border border-glass-border bg-glass p-3 text-sm outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, category: c })} className={cn('chip transition-colors', form.category === c && 'bg-teal/15 text-teal border-teal/40')}>
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="grid w-full place-items-center rounded-2xl bg-teal py-4 text-sm font-bold text-primary-foreground teal-glow">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Location</p>
                  <button type="button" onClick={() => refresh()} className="flex items-center gap-1 text-[11px] font-semibold text-teal">
                    <RefreshCw className="size-3" /> Refresh GPS
                  </button>
                </div>
                <p className="mt-1 text-sm font-bold">{form.address || 'Getting address…'}</p>
                <p className="text-[11px] text-muted-foreground">{hasLocation ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : 'Waiting for location…'}</p>
                <div className="mt-3 flex items-center gap-2"><MapPin className="size-4 text-teal" /><Chip tone="teal">Your location</Chip></div>
              </GlassCard>
              {hasLocation && (
                <div className="h-40 overflow-hidden rounded-2xl border border-glass-border">
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
                <GlassCard className="border-sev-med/30">
                  <p className="text-xs font-bold text-sev-med">Similar reports nearby</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Merge into an existing issue instead of creating a duplicate?</p>
                  <div className="mt-3 space-y-2">
                    {duplicates.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setMergeIntoId(mergeIntoId === d.id ? undefined : d.id)}
                        className={cn('w-full rounded-xl border px-3 py-2 text-left text-sm', mergeIntoId === d.id ? 'border-teal bg-teal/10' : 'border-glass-border')}
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}
              <button type="button" disabled={submitting || !hasLocation} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 text-sm font-bold text-primary-foreground teal-glow disabled:opacity-50">
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
