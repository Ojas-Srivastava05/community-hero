import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Send, ChevronLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '../lib/auth'
import { apiChat } from '../lib/api'
import { useLocation } from '../lib/location'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'ai'; text: string }

const PROMPTS = [
  'What issues are near me?',
  'How do I report garbage?',
  'Show my report status',
]

export function AssistantPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const { location } = useLocation()
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "Hi! I'm Civic AI — ask about nearby issues, reporting, or your submissions." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text: string) => {
    if (!text.trim() || !user) return
    const next: Msg[] = [...messages, { role: 'user', text: text.trim() }]
    setMessages(next)
    setInput('')
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
  }

  if (!user) {
    return (
      <AppShell>
        <div className="px-5 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal/15"><Sparkles className="size-8 text-teal" /></div>
          <p className="mt-4 text-muted-foreground">Sign in to chat with Civic AI</p>
          <button type="button" disabled={signingIn} onClick={() => signInWithGoogle()} className="mt-6 rounded-2xl bg-teal px-8 py-3 text-sm font-bold text-primary-foreground teal-glow">
            Sign in with Google
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell bare>
      <div className="flex h-screen flex-col">
        <header className="glass-strong flex items-center gap-3 px-5 py-4">
          <Link to="/" className="grid size-9 place-items-center rounded-xl border border-glass-border"><ChevronLeft className="size-4" /></Link>
          <div className="grid size-10 place-items-center rounded-xl bg-teal/20 ring-1 ring-teal/40"><Sparkles className="size-5 text-teal" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Civic AI</p>
            <p className="truncate text-[11px] text-sev-low">Powered by Gemini</p>
          </div>
        </header>
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-teal text-primary-foreground rounded-br-md' : 'glass rounded-bl-md')}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex justify-start gap-1.5 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} className="size-1.5 rounded-full bg-teal" />
              ))}
            </div>
          )}
          {messages.length <= 1 && (
            <div className="pt-4">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Try asking</p>
              <div className="flex flex-col gap-2">
                {PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)} className="glass px-4 py-3 text-left text-sm transition-colors hover:bg-accent">{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="glass-strong border-t border-glass-border px-3 pb-3 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2 rounded-2xl border border-glass-border bg-glass px-3 py-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your ward, SLAs, hotspots…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <button type="submit" disabled={!input.trim()} className="grid size-9 place-items-center rounded-xl bg-teal text-primary-foreground disabled:opacity-40 teal-glow"><Send className="size-4" /></button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
