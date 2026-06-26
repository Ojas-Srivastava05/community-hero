import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronLeft, Film, Loader2, LogIn, MapPin, RefreshCw, Sparkles, Video, Zap } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { CivicMap } from '@/components/civic/CivicMap'
import { InvalidMediaCard, type InvalidMediaReason } from '@/components/civic/InvalidMediaCard'
import { PlacesAutocomplete } from '@/components/civic/PlacesAutocomplete'
import { useAuth } from '../lib/auth'
import { useLocation } from '../lib/location'
import { apiAnalyzeImage, apiCreateReport, apiListIssues, apiMergeIssue, apiReverseGeocode } from '../lib/api'
import { validateAndPreprocessImage } from '../lib/image-media'
import { extractVideoKeyframes, validateVideoFile } from '../lib/video-media'
import { usePointsToast } from '@/components/civic/PointsToast'
import { cn } from '@/lib/utils'
import { clearReportDraft, loadReportDraft, saveReportDraft } from '../lib/offline-drafts'
import type { IssueAnalysis } from '../../../shared/types'

const CATEGORIES = ['pothole', 'water_leak', 'streetlight', 'waste', 'road_damage', 'drainage', 'signage', 'encroachment', 'other']

export function ReportWizardPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const { location, loading: locLoading, refresh } = useLocation()
  const navigate = useNavigate()
  const { showPoints } = usePointsToast()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [mediaMode, setMediaMode] = useState<'photo' | 'video'>('photo')
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null)
  const [duplicates, setDuplicates] = useState<{ id: string; title: string }[]>([])
  const [serverDupes, setServerDupes] = useState<{ createdId: string; dupes: { id: string; title: string }[] } | null>(null)
  const [mergeIntoId, setMergeIntoId] = useState<string | undefined>()
  const [pinAdjusted, setPinAdjusted] = useState(false)
  const [geocodingPin, setGeocodingPin] = useState(false)
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
  const videoRef = useRef<HTMLInputElement>(null)
  const steps = ['Capture', 'Describe', 'Confirm']

  useEffect(() => {
    loadReportDraft()
      .then((draft) => {
        if (!draft) return
        setStep(draft.step)
        setForm(draft.form)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    void saveReportDraft({
      id: 'current',
      step,
      form,
      updatedAt: new Date().toISOString(),
    }).catch(() => {})
  }, [step, form])

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

  const runAnalysis = async (imageFile: File) => {
    if (!user) return
    setAnalyzing(true)
    try {
      const token = await user.getIdToken()
      const { analysis: a } = await apiAnalyzeImage(imageFile, token)
      setAnalysis(a)
      setForm((prev) => ({ ...prev, title: a.title, description: a.description, category: a.category, severity: a.severity }))
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  const onImageFile = async (raw: File) => {
    setError('')
    setMediaMode('photo')
    setVideoPreview(null)
    setProcessingMedia(true)
    const result = await validateAndPreprocessImage(raw)
    setProcessingMedia(false)
    if (!result.ok) {
      setInvalidMedia(result.reason)
      setFile(null)
      setPreview(null)
      setAnalysis(null)
      return
    }
    setInvalidMedia(null)
    const f = result.file
    setFile(f)
    setPreview(URL.createObjectURL(f))
    await runAnalysis(f)
  }

  const onVideoFile = async (raw: File) => {
    setError('')
    const validation = validateVideoFile(raw)
    if (validation !== 'ok') {
      setInvalidMedia(validation === 'not-video' ? 'not-image' : 'too-large')
      return
    }
    setInvalidMedia(null)
    setMediaMode('video')
    setVideoPreview(URL.createObjectURL(raw))
    setProcessingMedia(true)
    try {
      const frames = await extractVideoKeyframes(raw)
      const primary = frames[0]
      if (!primary) throw new Error('Could not extract video frames')
      setFile(primary)
      setPreview(URL.createObjectURL(primary))
      await runAnalysis(primary)
    } catch (e) {
      setError(String(e))
      setFile(null)
      setPreview(null)
    } finally {
      setProcessingMedia(false)
    }
  }

  const retakePhoto = () => {
    setInvalidMedia(null)
    setFile(null)
    setPreview(null)
    setVideoPreview(null)
    setAnalysis(null)
    if (fileRef.current) fileRef.current.value = ''
    if (videoRef.current) videoRef.current.value = ''
    fileRef.current?.click()
  }

  const handleMapPin = async (lat: number, lng: number) => {
    setPinAdjusted(true)
    setForm((prev) => ({ ...prev, lat, lng }))
    setGeocodingPin(true)
    try {
      const place = await apiReverseGeocode(lat, lng)
      setForm((prev) => ({ ...prev, lat, lng, address: place.address || prev.address }))
    } catch {
      setForm((prev) => ({ ...prev, lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }))
    } finally {
      setGeocodingPin(false)
    }
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
      const pe = result.pointsEarned
      const pts = pe?.pointsAwarded ?? (mergeIntoId ? 15 : 10)
      const parts = [
        mergeIntoId ? 'Duplicate Hunter' : 'Report submitted',
        pe?.streakBonus ? `${pe.streakBonus} streak bonus` : '',
        ...(pe?.badgesEarned ?? []),
      ].filter(Boolean)
      showPoints(pts, parts.join(' · ') || undefined)
      await clearReportDraft()

      if (result.duplicateSuggestions?.length && !mergeIntoId && !result.merged) {
        setServerDupes({ createdId: result.id, dupes: result.duplicateSuggestions })
        setSubmitting(false)
        return
      }

      navigate(`/issues/${result.id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const mergeServerDupe = async (targetId: string) => {
    if (!user || !serverDupes) return
    setSubmitting(true)
    setError('')
    try {
      const token = await user.getIdToken()
      const r = await apiMergeIssue(serverDupes.createdId, targetId, token)
      const pe = r.pointsEarned as { pointsAwarded?: number; badgesEarned?: string[] } | undefined
      showPoints(pe?.pointsAwarded ?? 15, pe?.badgesEarned?.join(' · ') || 'Merged into existing report')
      navigate(`/issues/${targetId}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const viewCreatedReport = () => {
    if (!serverDupes) return
    navigate(`/issues/${serverDupes.createdId}`)
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
                {videoPreview && mediaMode === 'video' ? (
                  <video src={videoPreview} className="size-full object-cover" controls muted playsInline />
                ) : preview ? (
                  <img src={preview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 grid place-items-center">
                      <Camera className="size-16 text-ink-muted/40" />
                    </div>
                    <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-coral/40" />
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onImageFile(e.target.files[0])} />
                <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onVideoFile(e.target.files[0])} />
              </div>
              <GlassCard className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-coral" />
                <p className="text-xs text-ink-muted">Photo or short video (≤15s). AI extracts keyframes and auto-detects category, severity, and location.</p>
              </GlassCard>
              {invalidMedia && (
                <InvalidMediaCard reason={invalidMedia} onRetake={retakePhoto} />
              )}
              {!user ? (
                <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                  <LogIn className="size-4" /> {signingIn ? 'Opening Google…' : 'Sign in to submit'}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="grid place-items-center rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                    <span className="flex items-center gap-2"><Camera className="size-4" /> {preview && mediaMode === 'photo' ? 'Retake' : 'Photo'}</span>
                  </button>
                  <button type="button" onClick={() => videoRef.current?.click()} className="grid place-items-center rounded-2xl border border-coral/40 bg-coral-soft py-4 text-sm font-bold text-coral">
                    <span className="flex items-center gap-2"><Video className="size-4" /> {videoPreview ? 'New video' : 'Video'}</span>
                  </button>
                </div>
              )}
              {mediaMode === 'video' && file && (
                <p className="flex items-center justify-center gap-2 text-[11px] text-ink-muted"><Film className="size-3.5" /> Using middle keyframe for AI analysis</p>
              )}
              {processingMedia && <p className="flex items-center justify-center gap-2 text-sm text-ink-muted"><Loader2 className="size-4 animate-spin" /> {mediaMode === 'video' ? 'Extracting keyframes…' : 'Optimizing photo…'}</p>}
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
                  <button type="button" onClick={() => { setPinAdjusted(false); refresh() }} className="flex items-center gap-1 text-[11px] font-semibold text-coral">
                    <RefreshCw className="size-3" /> Refresh GPS
                  </button>
                </div>
                <PlacesAutocomplete
                  value={form.address}
                  onChange={(address) => setForm((prev) => ({ ...prev, address }))}
                  onPlaceSelect={({ lat, lng, address }) => {
                    setPinAdjusted(true)
                    setForm((prev) => ({ ...prev, lat, lng, address }))
                  }}
                  placeholder="Search address or tap map to drop pin"
                  className="mt-2 w-full rounded-2xl border border-rule bg-paper p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-coral/30"
                />
                <p className="mt-2 text-[11px] text-ink-muted">
                  {hasLocation ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : 'Waiting for location…'}
                  {geocodingPin && ' · Updating address…'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <MapPin className="size-4 text-coral" />
                  <Chip tone="coral">{pinAdjusted ? 'Pin adjusted' : 'Your location'}</Chip>
                </div>
              </GlassCard>
              {hasLocation && (
                <div className="h-48 overflow-hidden rounded-2xl border border-rule">
                  <CivicMap
                    center={{ lat: form.lat, lng: form.lng }}
                    pinPosition={{ lat: form.lat, lng: form.lng }}
                    onMapClick={handleMapPin}
                    issues={[]}
                    zoom={16}
                    className="size-full"
                  />
                </div>
              )}
              <p className="text-center text-[11px] text-ink-muted">Tap the map to adjust the pin if GPS is inaccurate</p>
              {serverDupes ? (
                <GlassCard className="border-amber/30 bg-amber-soft/30">
                  <p className="text-xs font-bold text-amber">AI found similar reports</p>
                  <p className="mt-1 text-[11px] text-ink-muted">Your report was saved. Merge it into an existing issue to avoid duplicates?</p>
                  <div className="mt-3 space-y-2">
                    {serverDupes.dupes.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        disabled={submitting}
                        onClick={() => mergeServerDupe(d.id)}
                        className="w-full rounded-xl border border-rule px-3 py-2 text-left text-sm text-ink hover:border-coral hover:bg-coral-soft"
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={viewCreatedReport}
                    className="mt-3 w-full rounded-xl border border-coral/40 py-2 text-sm font-semibold text-coral"
                  >
                    Keep my new report
                  </button>
                </GlassCard>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
          {error && <p className="mt-4 rounded-xl border border-sev-critical/30 bg-sev-critical/10 px-4 py-3 text-sm text-sev-critical">{error}</p>}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}
