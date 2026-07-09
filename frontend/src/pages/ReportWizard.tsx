import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronLeft, Film, Loader2, LogIn, MapPin, Mic, RefreshCw, Sparkles, Video, Zap } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard, Chip } from '@/components/civic/GlassCard'
import { CivicMap } from '@/components/civic/CivicMap'
import { InvalidMediaCard, type InvalidMediaReason } from '@/components/civic/InvalidMediaCard'
import { PlacesAutocomplete } from '@/components/civic/PlacesAutocomplete'
import { useAuth } from '../lib/auth'
import { LanguagePicker, useI18n } from '../lib/i18n'
import { useLocation } from '../lib/location'
import { apiAnalyzeImage, apiCreateReport, apiListIssues, apiMergeIssue, apiReverseGeocode, apiTranscribeAudio } from '../lib/api'
import { validateAndPreprocessImage } from '../lib/image-media'
import { extractVideoKeyframes, validateVideoFile } from '../lib/video-media'
import { mediaRecorderSupported, speechRecognitionSupported, startSpeechDictation, recordVoiceNote } from '../lib/voice-media'
import { usePointsToast } from '@/components/civic/PointsToast'
import { AgentPipelineStepper, buildSubmitPipelineSteps, mergePipelineSteps } from '@/components/civic/AgentPipelineStepper'
import { cn } from '@/lib/utils'
import { clearReportDraft, loadReportDraft, saveReportDraft } from '../lib/offline-drafts'
import { queueOfflineReport, registerOfflineSync } from '../lib/offline-queue'
import type { IssueAnalysis } from '../../../shared/types'
import type { AgentStep } from '../lib/shared-constants'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { apiSeverityToUi } from '@/lib/issue-ui'

const CATEGORIES = ['pothole', 'water_leak', 'streetlight', 'waste', 'road_damage', 'drainage', 'signage', 'encroachment', 'other']
const SEVERITY_LEVELS = [1, 2, 3, 4, 5] as const

export function ReportWizardPage() {
  const { user, signInWithGoogle, signInWithDemo, signInAsGuest, signingIn } = useAuth()
  const { t, locale, confidenceThreshold } = useI18n()
  const { location, loading: locLoading, error: locError, refresh } = useLocation()
  const navigate = useNavigate()
  const { showPoints } = usePointsToast()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [mediaMode, setMediaMode] = useState<'photo' | 'video' | 'voice'>('photo')
  const [listening, setListening] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const voiceStopRef = useRef<(() => void) | null>(null)
  const voiceRecordStopRef = useRef<(() => Promise<unknown>) | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null)
  const [duplicates, setDuplicates] = useState<{ id: string; title: string }[]>([])
  const [serverDupes, setServerDupes] = useState<{ createdId: string; dupes: { id: string; title: string }[] } | null>(null)
  const [mergeIntoId, setMergeIntoId] = useState<string | undefined>()
  const [pinAdjusted, setPinAdjusted] = useState(false)
  const [geocodingPin, setGeocodingPin] = useState(false)
  const FALLBACK_CENTER = { lat: 12.9716, lng: 77.5946, address: 'Bengaluru (tap map to set exact pin)' }
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
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>([])
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const steps = [t('report.step.capture'), t('report.step.describe'), t('report.step.confirm')]

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

  // When GPS fails, seed a fallback center so the confirm map is usable
  useEffect(() => {
    if (locLoading || location) return
    if (locError) {
      setForm((prev) => {
        if (prev.lat !== 0 || prev.lng !== 0) return prev
        return { ...prev, ...FALLBACK_CENTER }
      })
    }
  }, [locLoading, location, locError])

  useEffect(() => {
    if (!user) return
    return registerOfflineSync(async (data, imageFile) => {
      const token = await user.getIdToken()
      await apiCreateReport(
        {
          title: String(data.title || ''),
          description: String(data.description || ''),
          category: String(data.category || 'other'),
          severity: Number(data.severity || 3),
          lat: Number(data.lat),
          lng: Number(data.lng),
          address: String(data.address || ''),
          confidence: data.confidence !== undefined ? Number(data.confidence) : undefined,
          safety_risk: data.safety_risk !== undefined ? Boolean(data.safety_risk) : undefined,
          department: data.department !== undefined ? String(data.department) : undefined,
        },
        [imageFile],
        token,
      )
    })
  }, [user])

  const runAnalysis = async (imageFile: File) => {
    if (!user) return
    setAnalyzing(true)
    setPipelineRunning(true)
    try {
      const token = await user.getIdToken()
      const { analysis: a, agentSteps } = await apiAnalyzeImage(imageFile, token)
      setAnalysis(a)
      setPipelineSteps(agentSteps || [])
      setForm((prev) => ({ ...prev, title: a.title, description: a.description, category: a.category, severity: a.severity }))
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
      setPipelineRunning(false)
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
    if (!user || !form.lat) return
    if (!file && form.description.trim().length < 8) {
      setError('Add a photo or speak/type a description first')
      return
    }
    if (!navigator.onLine) {
      if (!file) {
        setError('Offline — add a photo to queue this report')
        return
      }
      try {
        await queueOfflineReport(
          {
            ...form,
            ...(analysis
              ? { confidence: analysis.confidence, safety_risk: analysis.safety_risk, department: analysis.department }
              : {}),
          },
          file,
        )
        setError(t('report.offlineQueued'))
        return
      } catch {
        setError('Offline — could not queue report')
        return
      }
    }
    setSubmitting(true)
    setPipelineRunning(true)
    setPipelineSteps(buildSubmitPipelineSteps())
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
        file ? [file] : [],
        token,
        {
          stream: true,
          onAgentStep: (stepUpdate) => {
            setPipelineSteps((prev) =>
              mergePipelineSteps(prev.length ? prev : buildSubmitPipelineSteps(), [stepUpdate]),
            )
          },
        },
      )
      if (result.agentSteps?.length) {
        setPipelineSteps(mergePipelineSteps(buildSubmitPipelineSteps(), result.agentSteps))
      }
      const pe = result.pointsEarned
      if (pe?.pointsAwarded && pe.pointsAwarded > 0) {
        const parts = [
          mergeIntoId ? 'Duplicate Hunter' : 'Report submitted',
          pe.streakBonus ? `${pe.streakBonus} streak bonus` : '',
          ...(pe.badgesEarned ?? []),
        ].filter(Boolean)
        showPoints(pe.pointsAwarded, parts.join(' · ') || undefined)
      } else {
        showPoints(0, 'Report submitted')
      }
      await clearReportDraft()

      if (result.needsReview) {
        navigate(`/issues/${result.id}`, { state: { needsReview: true } })
        return
      }

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
      setPipelineRunning(false)
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
      if (pe?.pointsAwarded && pe.pointsAwarded > 0) {
        showPoints(pe.pointsAwarded, pe.badgesEarned?.join(' · ') || 'Merged into existing report')
      }
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

  const toggleVoice = async () => {
    if (listening) {
      voiceStopRef.current?.()
      voiceStopRef.current = null
      const stopRec = voiceRecordStopRef.current
      voiceRecordStopRef.current = null
      setListening(false)
      if (stopRec && user) {
        setVoiceBusy(true)
        try {
          const captured = (await stopRec()) as { audioBlob?: Blob; mimeType?: string }
          if (captured.audioBlob && captured.audioBlob.size > 1000) {
            const token = await user.getIdToken()
            const result = await apiTranscribeAudio(captured.audioBlob, token, captured.mimeType)
            setForm((prev) => ({
              ...prev,
              title: result.title || prev.title,
              description: result.description || result.transcript || prev.description,
            }))
            setStep(1)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Voice transcription failed')
        } finally {
          setVoiceBusy(false)
        }
      }
      return
    }
    setMediaMode('voice')
    setError('')
    setListening(true)
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      kn: 'kn-IN',
    }
    if (speechRecognitionSupported()) {
      const ctl = startSpeechDictation({
        lang: langMap[locale] || 'en-IN',
        onPartial: (text) => setForm((prev) => ({ ...prev, description: text })),
        onFinal: (text) => {
          setForm((prev) => ({
            ...prev,
            description: text,
            title: prev.title || text.split(/[.!?]/)[0]?.slice(0, 60) || prev.title,
          }))
        },
        onError: (err) => setError(err),
      })
      voiceStopRef.current = ctl.stop
    }
    if (mediaRecorderSupported()) {
      try {
        const rec = await recordVoiceNote(25_000)
        voiceRecordStopRef.current = rec.stop
      } catch {
        /* mic denied — speech-only still ok */
      }
    }
  }

  const hasLocation: boolean = form.lat !== 0 && form.lng !== 0

  return (
    <AppShell hideNav>
      <PageHeader
        title={t('report.title')}
        subtitle={`Step ${step + 1} of 3 — ${steps[step]}`}
        right={
          <div className="flex items-center gap-2">
            <LanguagePicker />
            <button
              type="button"
              aria-label={step === 0 ? 'Back to home' : 'Previous step'}
              onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
              className="grid size-9 place-items-center rounded-xl border border-rule"
            >
              <ChevronLeft className="size-4 text-ink" />
            </button>
          </div>
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
                {mediaMode === 'voice' && !preview ? (
                  <div className="absolute inset-0 grid place-items-center bg-coral-soft/40">
                    <div className="text-center">
                      <Mic className={cn('mx-auto size-16 text-coral', listening && 'animate-pulse')} />
                      <p className="mt-3 px-6 text-sm font-semibold text-ink">
                        {listening ? t('report.listening') : t('report.voiceHint')}
                      </p>
                    </div>
                  </div>
                ) : videoPreview && mediaMode === 'video' ? (
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
                <p className="text-xs text-ink-muted">Photo, short video (≤15s), or voice note. AI classifies and routes to the right department.</p>
              </GlassCard>
              {invalidMedia && (
                <InvalidMediaCard reason={invalidMedia} onRetake={retakePhoto} />
              )}
              {!user ? (
                <div className="space-y-2">
                  <button type="button" disabled={signingIn} onClick={() => signInWithDemo('citizen')} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                    <LogIn className="size-4" /> {signingIn ? 'Signing in…' : t('report.demoCitizen')}
                  </button>
                  <button type="button" disabled={signingIn} onClick={() => signInAsGuest()} className="w-full rounded-2xl border border-coral/40 bg-coral-soft py-3 text-sm font-semibold text-coral">
                    {signingIn ? 'Signing in…' : t('login.guest')}
                  </button>
                  <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="w-full rounded-2xl border border-rule py-3 text-sm font-semibold text-ink">
                    {signingIn ? 'Opening Google…' : t('report.signIn')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => { setMediaMode('photo'); fileRef.current?.click() }} className="grid place-items-center rounded-2xl bg-coral py-3 text-xs font-bold text-paper ink-glow">
                    <span className="flex flex-col items-center gap-1"><Camera className="size-4" /> {t('report.photo')}</span>
                  </button>
                  <button type="button" onClick={() => { setMediaMode('video'); videoRef.current?.click() }} className="grid place-items-center rounded-2xl border border-coral/40 bg-coral-soft py-3 text-xs font-bold text-coral">
                    <span className="flex flex-col items-center gap-1"><Video className="size-4" /> {t('report.video')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={voiceBusy}
                    onClick={() => void toggleVoice()}
                    className={cn(
                      'grid place-items-center rounded-2xl border py-3 text-xs font-bold',
                      listening ? 'border-coral bg-coral text-paper' : 'border-rule bg-paper text-ink',
                    )}
                  >
                    <span className="flex flex-col items-center gap-1">
                      {voiceBusy ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                      {listening ? 'Stop' : t('report.voice')}
                    </span>
                  </button>
                </div>
              )}
              {form.description && mediaMode === 'voice' && (
                <GlassCard>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Transcript</p>
                  <p className="mt-1 text-sm text-ink">{form.description}</p>
                </GlassCard>
              )}
              {mediaMode === 'video' && file && (
                <p className="flex items-center justify-center gap-2 text-[11px] text-ink-muted"><Film className="size-3.5" /> Using middle keyframe for AI analysis</p>
              )}
              {processingMedia && <p className="flex items-center justify-center gap-2 text-sm text-ink-muted"><Loader2 className="size-4 animate-spin" /> {mediaMode === 'video' ? 'Extracting keyframes…' : 'Optimizing photo…'}</p>}
              {analyzing && <p className="flex items-center justify-center gap-2 text-sm text-coral"><Loader2 className="size-4 animate-spin" /> {t('report.analyzing')}</p>}
              {(pipelineSteps.length > 0 || pipelineRunning) && (
                <AgentPipelineStepper steps={pipelineSteps} running={pipelineRunning || analyzing || submitting} />
              )}
              {((file && user) || (user && form.description.trim().length >= 8)) && (
                <button
                  type="button"
                  disabled={locLoading && !hasLocation}
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-xs font-semibold text-coral disabled:opacity-40"
                >
                  {locLoading && !hasLocation ? 'Getting your location…' : `${t('report.continue')} →`}
                </button>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              {analysis && (
                <GlassCard className="border-coral/30 bg-coral-soft/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Zap className="size-4 text-coral" /><p className="text-xs font-bold uppercase tracking-wider text-coral">AI detected</p></div>
                    <SeverityBadge severity={apiSeverityToUi(form.severity)} />
                  </div>
                  <p className="mt-2 text-sm text-ink">{form.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip tone="coral">{Math.round(analysis.confidence * 100)}% confidence</Chip>
                    {(analysis.department || form.category) && (
                      <Chip tone="indigo">
                        {analysis.department || form.category.replace(/_/g, ' ')}
                      </Chip>
                    )}
                  </div>
                  {analysis.confidence < confidenceThreshold && (
                    <p className="mt-2 rounded-xl border border-amber/30 bg-amber-soft/40 px-3 py-2 text-[11px] font-medium text-amber">
                      {t('report.lowConfidence')} — report may enter draft review
                    </p>
                  )}
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
              <div>
                <label className="text-xs font-semibold text-ink-muted">Severity</label>
                <div className="mt-2 flex gap-2">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm({ ...form, severity: level })}
                      className={cn(
                        'flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors',
                        form.severity === level ? 'border-coral bg-coral-soft text-coral' : 'border-rule text-ink-muted',
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              {(pipelineSteps.length > 0 && step >= 1) && (
                <AgentPipelineStepper steps={pipelineSteps} running={pipelineRunning || submitting} />
              )}
              <button type="button" onClick={() => setStep(2)} className="grid w-full place-items-center rounded-2xl bg-coral py-4 text-sm font-bold text-paper ink-glow">
                {t('report.continue')}
              </button>
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
                  <Chip tone="coral">
                    {pinAdjusted ? 'Pin adjusted' : locError ? 'Tap map to set pin' : 'Your location'}
                  </Chip>
                </div>
              </GlassCard>
              <div className="h-48 overflow-hidden rounded-2xl border border-rule">
                <CivicMap
                  center={{
                    lat: hasLocation ? form.lat : FALLBACK_CENTER.lat,
                    lng: hasLocation ? form.lng : FALLBACK_CENTER.lng,
                  }}
                  pinPosition={
                    hasLocation ? { lat: form.lat, lng: form.lng } : undefined
                  }
                  onMapClick={handleMapPin}
                  issues={[]}
                  zoom={16}
                  className="size-full"
                />
              </div>
              <p className="text-center text-[11px] text-ink-muted">
                {hasLocation ? 'Tap the map to adjust the pin if GPS is inaccurate' : 'Tap the map to drop your report pin'}
              </p>
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
                    {mergeIntoId ? 'Merge into existing report' : t('report.submit')}
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
