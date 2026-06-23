import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Sparkles, ChevronLeft, Loader2 } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../lib/auth'
import { apiAnalyzeImage, apiCreateReport } from '../lib/api'
import type { IssueAnalysis } from '../../../shared/types'

const DEFAULT_LOC = { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bengaluru' }

export function ReportWizardPage() {
  const { user, signInWithGoogle, configured } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    severity: 3,
    ...DEFAULT_LOC,
  })
  const [error, setError] = useState('')

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
      setForm((prev) => ({
        ...prev,
        title: a.title,
        description: a.description,
        category: a.category,
        severity: a.severity,
      }))
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  const submit = async () => {
    if (!user || !file) return
    setSubmitting(true)
    setError('')
    try {
      const token = await user.getIdToken()
      const { id } = await apiCreateReport(form, [file], token)
      navigate(`/issues/${id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!configured) {
    return (
      <div className="p-6 pb-32">
        <p className="text-mist">Firebase not configured.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 flex items-center gap-3 px-6 py-4">
        <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-mist">Step {step} of 3</p>
          <h1 className="text-lg font-semibold">Report Issue</h1>
        </div>
      </header>

      <main className="space-y-6 px-6 pt-4">
        {step === 1 && (
          <>
            <GlassCard className="flex flex-col items-center gap-4 py-10">
              {preview ? (
                <img src={preview} alt="Preview" className="h-48 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-elevated">
                  <Camera size={40} className="text-mist" />
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              <button type="button" className="btn-primary max-w-xs" onClick={() => fileRef.current?.click()}>
                <Camera size={18} className="inline mr-2" />
                Capture or upload photo
              </button>
              {analyzing && (
                <p className="flex items-center gap-2 text-sm text-teal">
                  <Loader2 size={16} className="animate-spin" /> Gemini analyzing…
                </p>
              )}
            </GlassCard>
            {!user && (
              <button type="button" className="btn-primary" onClick={() => signInWithGoogle()}>
                Sign in to continue
              </button>
            )}
            {file && user && (
              <button type="button" className="btn-primary" onClick={() => setStep(2)}>
                Continue
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 text-teal">
              <Sparkles size={18} />
              <span className="text-sm font-medium">AI pre-filled — edit if needed</span>
            </div>
            {['title', 'description'].map((field) => (
              <label key={field} className="block">
                <span className="text-xs uppercase tracking-wider text-mist">{field}</span>
                {field === 'description' ? (
                  <textarea
                    className="mt-1 w-full rounded-xl bg-elevated p-3 text-sm outline-none ring-1 ring-white/10"
                    rows={3}
                    value={form[field as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                ) : (
                  <input
                    className="mt-1 w-full rounded-xl bg-elevated p-3 text-sm outline-none ring-1 ring-white/10"
                    value={form[field as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-mist">Category</span>
              <select
                className="mt-1 w-full rounded-xl bg-elevated p-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {['pothole', 'water_leak', 'streetlight', 'waste', 'road_damage', 'drainage', 'signage', 'encroachment', 'other'].map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-mist">Severity (1–5)</span>
              <input
                type="range"
                min={1}
                max={5}
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
                className="mt-2 w-full accent-teal"
              />
              <span className="text-teal font-semibold">{form.severity}</span>
            </label>
            {analysis && (
              <p className="text-xs text-mist">Confidence: {Math.round(analysis.confidence * 100)}% · {analysis.estimated_fix_days}</p>
            )}
            <button type="button" className="btn-primary" onClick={() => setStep(3)}>Confirm location</button>
          </>
        )}

        {step === 3 && (
          <>
            <GlassCard>
              <div className="flex items-start gap-3">
                <MapPin className="text-teal shrink-0" size={20} />
                <div>
                  <p className="font-medium">{form.address}</p>
                  <p className="text-xs text-mist">{form.lat.toFixed(4)}, {form.lng.toFixed(4)}</p>
                  <p className="mt-2 text-xs text-mist">GPS auto-detected (demo: Koramangala). Production uses browser geolocation.</p>
                </div>
              </div>
            </GlassCard>
            <button
              type="button"
              className="btn-primary flex items-center justify-center gap-2"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              Submit report
            </button>
          </>
        )}

        {error && <p className="text-sm text-critical">{error}</p>}
      </main>
    </div>
  )
}
