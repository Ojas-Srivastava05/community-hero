import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONFIDENCE_THRESHOLD } from './shared-constants'
import {
  APP_STRINGS,
  BN_STRINGS,
  HI_STRINGS,
  KN_STRINGS,
  MR_STRINGS,
  TA_STRINGS,
  TE_STRINGS,
} from './i18n/strings'

export type Locale = 'en' | 'hi' | 'mr' | 'ta' | 'bn' | 'te' | 'kn'

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिंदी' },
  { id: 'mr', label: 'Marathi', native: 'मराठी' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
]

type Dict = Record<string, string>

const en: Dict = {
  ...APP_STRINGS,
  'report.title': 'Report an issue',
  'report.step.capture': 'Capture',
  'report.step.describe': 'Describe',
  'report.step.confirm': 'Confirm',
  'report.signIn': 'Sign in to submit',
  'report.demoCitizen': 'Submit without login',
  'report.demoCitizenHint': 'Demo access — no personal email or phone required',
  'report.photo': 'Photo',
  'report.video': 'Video',
  'report.voice': 'Voice',
  'report.continue': 'Continue',
  'report.submit': 'Submit report',
  'report.analyzing': 'Analyzing…',
  'report.lowConfidence': 'Low confidence — may need admin review',
  'report.offlineQueued': 'Saved offline — will submit when back online',
  'report.listening': 'Listening… tap to stop',
  'report.voiceHint': 'Speak the issue in your language — we fill the form',
  'login.demoCitizen': 'Submit without login',
  'login.demoAdmin': 'Enter as demo authority',
  'login.google': 'Optional: sign in with Google',
  'login.guest': 'Fully anonymous guest',
  'proof.verified': 'AI verified fix',
  'proof.mismatch': 'AI could not verify fix',
  'proof.slider': 'Drag to compare before / after',
  'scorecards.title': 'Department accountability',
  'comments.title': 'Community discussion',
  'comments.placeholder': 'Add a public comment…',
  'comments.post': 'Post',
  'comments.signIn': 'Sign in to comment',
  'lang.toggle': 'Language',
}

const hi: Dict = {
  ...en,
  ...HI_STRINGS,
  'report.title': 'समस्या दर्ज करें',
  'report.step.capture': 'फोटो',
  'report.step.describe': 'विवरण',
  'report.step.confirm': 'पुष्टि',
  'report.signIn': 'जमा करने के लिए साइन इन करें',
  'report.demoCitizen': 'बिना लॉगिन के दर्ज करें',
  'report.demoCitizenHint': 'डेमो एक्सेस — व्यक्तिगत ईमेल या फ़ोन की ज़रूरत नहीं',
  'report.photo': 'फोटो',
  'report.video': 'वीडियो',
  'report.voice': 'आवाज़',
  'report.continue': 'आगे बढ़ें',
  'report.submit': 'रिपोर्ट जमा करें',
  'report.analyzing': 'विश्लेषण हो रहा है…',
  'report.lowConfidence': 'कम विश्वास — एडमिन समीक्षा की जरूरत हो सकती है',
  'report.offlineQueued': 'ऑफ़लाइन सहेजा — ऑनलाइन होते ही जमा होगा',
  'report.listening': 'सुन रहा है… रोकने के लिए टैप करें',
  'report.voiceHint': 'अपनी भाषा में समस्या बोलें — हम फ़ॉर्म भरेंगे',
  'login.demoCitizen': 'डेमो नागरिक के रूप में प्रवेश',
  'login.demoAdmin': 'डेमो अधिकारी के रूप में प्रवेश',
  'login.google': 'Google से जारी रखें',
  'login.guest': 'अतिथि के रूप में जारी रखें',
  'proof.verified': 'AI ने मरम्मत की पुष्टि की',
  'proof.mismatch': 'AI मरम्मत की पुष्टि नहीं कर सका',
  'proof.slider': 'पहले / बाद की तुलना के लिए खींचें',
  'scorecards.title': 'विभाग जवाबदेही',
  'comments.title': 'समुदाय चर्चा',
  'comments.placeholder': 'सार्वजनिक टिप्पणी लिखें…',
  'comments.post': 'पोस्ट',
  'comments.signIn': 'टिप्पणी के लिए साइन इन करें',
  'lang.toggle': 'भाषा',
}

const mr: Dict = {
  ...en,
  ...MR_STRINGS,
  'report.title': 'समस्या नोंदवा',
  'report.step.capture': 'छायाचित्र',
  'report.step.describe': 'वर्णन',
  'report.step.confirm': 'पुष्टी',
  'report.signIn': 'सबमिट करण्यासाठी साइन इन करा',
  'report.demoCitizen': 'डेमो नागरिक म्हणून वापरा',
  'report.photo': 'फोटो',
  'report.video': 'व्हिडिओ',
  'report.voice': 'आवाज',
  'report.continue': 'पुढे',
  'report.submit': 'अहवाल सबमिट करा',
  'report.analyzing': 'विश्लेषण सुरू…',
  'report.listening': 'ऐकत आहे… थांबण्यासाठी टॅप करा',
  'report.voiceHint': 'तुमच्या भाषेत समस्या बोला — आम्ही फॉर्म भरतो',
  'login.demoCitizen': 'डेमो नागरिक म्हणून प्रवेश',
  'login.demoAdmin': 'डेमो अधिकारी म्हणून प्रवेश',
  'login.guest': 'अतिथी म्हणून सुरू ठेवा',
  'scorecards.title': 'विभाग जबाबदारी',
  'comments.title': 'समुदाय चर्चा',
  'comments.post': 'पोस्ट',
  'lang.toggle': 'भाषा',
}

const ta: Dict = {
  ...en,
  ...TA_STRINGS,
  'report.title': 'சிக்கலைப் பதிவு செய்',
  'report.step.capture': 'படம்',
  'report.step.describe': 'விவரம்',
  'report.step.confirm': 'உறுதி',
  'report.signIn': 'சமர்ப்பிக்க உள்நுழைக',
  'report.demoCitizen': 'டெமோ குடிமகனாக முயற்சி',
  'report.photo': 'படம்',
  'report.video': 'வீடியோ',
  'report.voice': 'குரல்',
  'report.continue': 'தொடரவும்',
  'report.submit': 'அறிக்கை சமர்ப்பி',
  'report.analyzing': 'பகுப்பாய்வு…',
  'report.listening': 'கேட்கிறது… நிறுத்த தட்டவும்',
  'report.voiceHint': 'உங்கள் மொழியில் சிக்கலைச் சொல்லுங்கள்',
  'login.demoCitizen': 'டெமோ குடிமகன்',
  'login.demoAdmin': 'டெமோ அதிகாரி',
  'login.guest': 'விருந்தினராகத் தொடரவும்',
  'scorecards.title': 'துறை பொறுப்பு',
  'comments.title': 'சமூக விவாதம்',
  'comments.post': 'பதிவு',
  'lang.toggle': 'மொழி',
}

const bn: Dict = {
  ...en,
  ...BN_STRINGS,
  'report.title': 'সমস্যা রিপোর্ট করুন',
  'report.step.capture': 'ছবি',
  'report.step.describe': 'বিবরণ',
  'report.step.confirm': 'নিশ্চিত',
  'report.signIn': 'জমা দিতে সাইন ইন করুন',
  'report.demoCitizen': 'ডেমো নাগরিক হিসেবে চেষ্টা',
  'report.photo': 'ছবি',
  'report.video': 'ভিডিও',
  'report.voice': 'কণ্ঠ',
  'report.continue': 'এগিয়ে যান',
  'report.submit': 'রিপোর্ট জমা দিন',
  'report.analyzing': 'বিশ্লেষণ হচ্ছে…',
  'report.listening': 'শুনছি… থামাতে ট্যাপ করুন',
  'report.voiceHint': 'আপনার ভাষায় সমস্যা বলুন — আমরা ফর্ম পূরণ করব',
  'login.demoCitizen': 'ডেমো নাগরিক',
  'login.demoAdmin': 'ডেমো কর্তৃপক্ষ',
  'login.guest': 'অতিথি হিসেবে চালিয়ে যান',
  'scorecards.title': 'বিভাগীয় জবাবদিহি',
  'comments.title': 'কমিউনিটি আলোচনা',
  'comments.post': 'পোস্ট',
  'lang.toggle': 'ভাষা',
}

const te: Dict = {
  ...en,
  ...TE_STRINGS,
  'report.title': 'సమస్యను నివేదించండి',
  'report.step.capture': 'ఫోటో',
  'report.step.describe': 'వివరణ',
  'report.step.confirm': 'నిర్ధారణ',
  'report.signIn': 'సమర్పించడానికి సైన్ ఇన్',
  'report.demoCitizen': 'డెమో పౌరుడిగా ప్రయత్నించండి',
  'report.photo': 'ఫోటో',
  'report.video': 'వీడియో',
  'report.voice': 'వాయిస్',
  'report.continue': 'కొనసాగించు',
  'report.submit': 'రిపోర్ట్ సమర్పించు',
  'report.analyzing': 'విశ్లేషిస్తోంది…',
  'report.listening': 'వింటోంది… ఆపడానికి ట్యాప్ చేయండి',
  'report.voiceHint': 'మీ భాషలో సమస్య చెప్పండి — మేము ఫారమ్ నింపుతాము',
  'login.demoCitizen': 'డెమో పౌరుడు',
  'login.demoAdmin': 'డెమో అధికారి',
  'login.guest': 'అతిథిగా కొనసాగించండి',
  'scorecards.title': 'శాఖ జవాబుదారీ',
  'comments.title': 'కమ్యూనిటీ చర్చ',
  'comments.post': 'పోస్ట్',
  'lang.toggle': 'భాష',
}

const kn: Dict = {
  ...en,
  ...KN_STRINGS,
  'report.title': 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
  'report.step.capture': 'ಫೋಟೋ',
  'report.step.describe': 'ವಿವರ',
  'report.step.confirm': 'ದೃಢೀಕರಿಸಿ',
  'report.signIn': 'ಸಲ್ಲಿಸಲು ಸೈನ್ ಇನ್',
  'report.demoCitizen': 'ಡೆಮೊ ನಾಗರಿಕರಾಗಿ ಪ್ರಯತ್ನಿಸಿ',
  'report.photo': 'ಫೋಟೋ',
  'report.video': 'ವೀಡಿಯೊ',
  'report.voice': 'ಧ್ವನಿ',
  'report.continue': 'ಮುಂದುವರಿಸಿ',
  'report.submit': 'ವರದಿ ಸಲ್ಲಿಸಿ',
  'report.analyzing': 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
  'report.listening': 'ಕೇಳುತ್ತಿದೆ… ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
  'report.voiceHint': 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸಮಸ್ಯೆ ಹೇಳಿ — ನಾವು ಫಾರ್ಮ್ ತುಂಬುತ್ತೇವೆ',
  'login.demoCitizen': 'ಡೆಮೊ ನಾಗರಿಕ',
  'login.demoAdmin': 'ಡೆಮೊ ಅಧಿಕಾರಿ',
  'login.guest': 'ಅತಿಥಿಯಾಗಿ ಮುಂದುವರಿಸಿ',
  'scorecards.title': 'ಇಲಾಖೆ ಜವಾಬ್ದಾರಿ',
  'comments.title': 'ಸಮುದಾಯ ಚರ್ಚೆ',
  'comments.post': 'ಪೋಸ್ಟ್',
  'lang.toggle': 'ಭಾಷೆ',
}

const MAP: Record<Locale, Dict> = { en, hi, mr, ta, bn, te, kn }

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  confidenceThreshold: number
  locales: typeof LOCALES
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = localStorage.getItem('ch-locale') as Locale | null
    if (stored && MAP[stored]) return stored
    return 'en'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('ch-locale', l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: string) => MAP[locale][key] || MAP.en[key] || key, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, confidenceThreshold: CONFIDENCE_THRESHOLD, locales: LOCALES }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function LanguagePicker({
  className,
  compact,
}: {
  className?: string
  /** Inline toolbar style (map search bar). */
  compact?: boolean
}) {
  const { locale, setLocale, locales, t } = useI18n()
  return (
    <label className={cn('inline-flex items-center gap-1', className)}>
      <Languages className={cn('text-ink-muted', compact ? 'size-3.5' : 'size-4')} aria-hidden />
      <span className="sr-only">{t('lang.toggle')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          'rounded-full border border-rule bg-paper font-semibold text-ink outline-none focus:ring-2 focus:ring-coral/30',
          compact ? 'max-w-[5.25rem] truncate px-2 py-1 text-[10px]' : 'px-3 py-1 text-xs',
        )}
        aria-label={t('lang.toggle')}
      >
        {locales.map((l) => (
          <option key={l.id} value={l.id}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  )
}
