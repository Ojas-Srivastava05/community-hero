import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CONFIDENCE_THRESHOLD } from './shared-constants'

export type Locale = 'en' | 'hi'

type Dict = Record<string, string>

const en: Dict = {
  'report.title': 'Report an issue',
  'report.step.capture': 'Capture',
  'report.step.describe': 'Describe',
  'report.step.confirm': 'Confirm',
  'report.signIn': 'Sign in to submit',
  'report.demoCitizen': 'Try as demo citizen',
  'report.photo': 'Photo',
  'report.video': 'Video',
  'report.continue': 'Continue',
  'report.submit': 'Submit report',
  'report.analyzing': 'Analyzing…',
  'report.lowConfidence': 'Low confidence — may need admin review',
  'report.offlineQueued': 'Saved offline — will submit when back online',
  'login.demoCitizen': 'Enter as demo citizen',
  'login.demoAdmin': 'Enter as demo authority',
  'login.google': 'Continue with Google',
  'proof.verified': 'AI verified fix',
  'proof.mismatch': 'AI could not verify fix',
  'proof.slider': 'Drag to compare before / after',
  'scorecards.title': 'Department accountability',
  'lang.toggle': 'हिंदी',
}

const hi: Dict = {
  'report.title': 'समस्या दर्ज करें',
  'report.step.capture': 'फोटो',
  'report.step.describe': 'विवरण',
  'report.step.confirm': 'पुष्टि',
  'report.signIn': 'जमा करने के लिए साइन इन करें',
  'report.demoCitizen': 'डेमो नागरिक के रूप में आज़माएँ',
  'report.photo': 'फोटो',
  'report.video': 'वीडियो',
  'report.continue': 'आगे बढ़ें',
  'report.submit': 'रिपोर्ट जमा करें',
  'report.analyzing': 'विश्लेषण हो रहा है…',
  'report.lowConfidence': 'कम विश्वास — एडमिन समीक्षा की जरूरत हो सकती है',
  'report.offlineQueued': 'ऑफ़लाइन सहेजा — ऑनलाइन होते ही जमा होगा',
  'login.demoCitizen': 'डेमो नागरिक के रूप में प्रवेश',
  'login.demoAdmin': 'डेमो अधिकारी के रूप में प्रवेश',
  'login.google': 'Google से जारी रखें',
  'proof.verified': 'AI ने मरम्मत की पुष्टि की',
  'proof.mismatch': 'AI मरम्मत की पुष्टि नहीं कर सका',
  'proof.slider': 'पहले / बाद की तुलना के लिए खींचें',
  'scorecards.title': 'विभाग जवाबदेही',
  'lang.toggle': 'English',
}

const MAP: Record<Locale, Dict> = { en, hi }

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  confidenceThreshold: number
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem('ch-locale') as Locale) || 'en'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('ch-locale', l)
  }, [])

  const t = useCallback((key: string) => MAP[locale][key] || MAP.en[key] || key, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, confidenceThreshold: CONFIDENCE_THRESHOLD }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
