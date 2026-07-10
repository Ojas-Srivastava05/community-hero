import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Send, ChevronLeft, Mic } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '../lib/auth'
import { apiChat } from '../lib/api'
import { useLocation } from '../lib/location'
import { useI18n, type Locale } from '../lib/i18n'
import { speechRecognitionSupported, startSpeechDictation } from '../lib/voice-media'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'ai'; text: string }

const PROMPTS = [
  { en: 'What open potholes are near me?', hi: 'मेरे पास खुले गड्ढे कहाँ हैं?' },
  { en: 'How many issues are resolved this week?', hi: 'इस सप्ताह कितने मुद्दे हल हुए?' },
  { en: 'How do I report garbage?', hi: 'कचरा की रिपोर्ट कैसे करें?' },
  { en: 'Show my report status', hi: 'मेरी रिपोर्ट की स्थिति दिखाएं' },
]

const SPEECH_LANG: Record<Locale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  kn: 'kn-IN',
}

export function AssistantPage() {
  const { user, signInWithGoogle, signInWithDemo, signingIn } = useAuth()
  const { location } = useLocation()
  const { locale, t } = useI18n()
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "Hi! I'm Civic AI — ask about nearby issues, reporting, or your submissions. हिंदी में भी पूछ सकते हैं। Tap the mic to speak." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const voiceStopRef = useRef<(() => void) | null>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => () => voiceStopRef.current?.(), [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || !user || typing) return
    const next: Msg[] = [...messages, { role: 'user', text: text.trim() }]
    setMessages(next)
    setInput('')
    transcriptRef.current = ''
    setTyping(true)
    try {
      const token = await user.getIdToken()
      const { reply } = await apiChat(
        next.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
        token,
        location?.lat,
        location?.lng,
      )
      setMessages([...next, { role: 'ai', text: reply }])
    } catch {
      setMessages([...next, { role: 'ai', text: "Sorry, I couldn't reach the server. Try again." }])
    } finally {
      setTyping(false)
    }
  }, [user, typing, messages, location?.lat, location?.lng])

  const stopVoice = useCallback(() => {
    voiceStopRef.current?.()
    voiceStopRef.current = null
    setListening(false)
    const text = transcriptRef.current.trim()
    if (text) void send(text)
  }, [send])

  const toggleVoice = () => {
    if (typing) return
    if (listening) {
      stopVoice()
      return
    }
    if (!speechRecognitionSupported()) {
      setVoiceError(t('assistant.voiceUnsupported'))
      return
    }
    setVoiceError(null)
    transcriptRef.current = ''
    setInput('')
    setListening(true)
    const ctl = startSpeechDictation({
      lang: SPEECH_LANG[locale] || 'en-IN',
      onPartial: (text) => {
        transcriptRef.current = text
        setInput(text)
      },
      onFinal: (text) => {
        transcriptRef.current = text
        setInput(text)
      },
      onError: (err) => {
        setVoiceError(err === 'not-allowed' ? 'Microphone permission denied' : err)
        setListening(false)
        voiceStopRef.current = null
      },
    })
    voiceStopRef.current = ctl.stop
  }

  if (!user) {
    return (
      <AppShell hideNav>
        <div className="space-y-3 px-5 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-soft"><Sparkles className="size-8 text-coral" /></div>
          <p className="mt-4 text-ink-muted">Sign in to chat with Civic AI</p>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithDemo('citizen')}
            className="mx-auto mt-4 block w-full max-w-xs rounded-2xl bg-coral px-8 py-3 text-sm font-bold text-paper ink-glow"
          >
            {signingIn ? 'Signing in…' : 'Try as demo citizen'}
          </button>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithGoogle()}
            className="mx-auto block w-full max-w-xs rounded-2xl border border-rule px-8 py-3 text-sm font-bold text-ink"
          >
            {signingIn ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        </div>
      </AppShell>
    )
  }

  const voiceSupported = speechRecognitionSupported()

  return (
    <AppShell bare hideNav>
      <div className="flex min-h-[100dvh] max-h-[100dvh] flex-col">
        <header className="glass-strong flex items-center gap-3 px-5 py-4">
          <Link to="/" className="grid size-9 place-items-center rounded-xl border border-rule"><ChevronLeft className="size-4 text-ink" /></Link>
          <div className="grid size-10 place-items-center rounded-xl bg-coral-soft ring-1 ring-coral/30"><Sparkles className="size-5 text-coral" /></div>
          <div className="min-w-0 flex-1">
            <p className="display truncate text-sm font-bold text-ink">Civic AI</p>
            <p className="truncate text-[11px] text-leaf">
              {listening ? t('assistant.listening') : 'English / हिंदी · Voice + Gemini'}
            </p>
          </div>
        </header>
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-coral text-paper rounded-br-md' : 'paper rounded-bl-md text-ink')}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex justify-start gap-1.5 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} className="size-1.5 rounded-full bg-coral" />
              ))}
            </div>
          )}
          {messages.length <= 1 && (
            <div className="pt-4">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Try asking</p>
              <div className="flex flex-col gap-2">
                {PROMPTS.map((p) => (
                  <button key={p.en} type="button" onClick={() => send(p.en)} disabled={typing || listening} className="paper px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-coral-soft disabled:opacity-50">
                    <span>{p.en}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{p.hi}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div
          className="glass-strong shrink-0 border-t border-rule px-3 pt-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
        >
          {voiceError && (
            <p className="mb-2 px-1 text-xs text-coral" role="alert">{voiceError}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (listening) stopVoice()
              else void send(input)
            }}
            className={cn(
              'flex items-center gap-2 rounded-2xl border bg-paper px-3 py-2 transition-colors',
              listening ? 'border-coral ring-2 ring-coral/20' : 'border-rule',
            )}
          >
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                transcriptRef.current = e.target.value
              }}
              placeholder={listening ? t('assistant.listening') : 'Ask in English or Hindi… / हिंदी या English में पूछें'}
              readOnly={listening}
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={typing}
                aria-label={listening ? t('assistant.listening') : t('assistant.voice')}
                aria-pressed={listening}
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-xl transition-colors',
                  listening ? 'bg-coral text-paper ink-glow animate-pulse' : 'border border-rule text-ink hover:bg-coral-soft',
                )}
              >
                <Mic className="size-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={(!input.trim() && !listening) || typing}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral text-paper disabled:opacity-40 ink-glow"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
