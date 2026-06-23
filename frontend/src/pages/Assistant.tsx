import { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../lib/auth'
import { apiChat } from '../lib/api'

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'What issues are near me?',
  'How do I report garbage?',
  'Show my report status',
]

export function AssistantPage() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I\'m your Civic Assistant. Ask about nearby issues, reporting, or your submissions.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || !user) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const { reply } = await apiChat(
        next.map((m) => ({ role: m.role, content: m.content })),
        token,
        12.9352,
        77.6245,
      )
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Sorry, I couldn\'t reach the server. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 pb-32 text-center">
        <Bot size={48} className="mx-auto text-teal mb-4" />
        <p className="text-mist mb-4">Sign in to chat with Civic Assistant</p>
        <button type="button" className="btn-primary" disabled={signingIn} onClick={() => signInWithGoogle()}>
          {signingIn ? 'Opening Google…' : 'Sign in'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col pb-32">
      <header className="glass sticky top-0 z-40 px-6 py-4">
        <h1 className="text-lg font-semibold">Civic Assistant</h1>
        <p className="text-xs text-mist">Powered by Gemini · function calling</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages.map((m, i) => (
          <GlassCard
            key={i}
            className={`max-w-[85%] p-3 text-sm ${m.role === 'user' ? 'ml-auto bg-teal/10' : ''}`}
          >
            {m.content}
          </GlassCard>
        ))}
        {loading && <p className="text-xs text-mist">Thinking…</p>}
        <div ref={endRef} />
      </div>

      <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
        {STARTERS.map((s) => (
          <button key={s} type="button" className="btn-ghost shrink-0 text-xs" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="glass mx-6 flex gap-2 rounded-full p-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          className="flex-1 bg-transparent px-3 text-sm outline-none"
          placeholder="Ask anything civic…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-midnight">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
