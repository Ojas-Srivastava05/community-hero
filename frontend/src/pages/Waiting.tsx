import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'

export function WaitingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = params.get('return') || '/'
  const isOverload = params.get('reason') === '503'
  const initialSeconds = Math.max(5, Number(params.get('retry') || params.get('retryAfter') || 30))
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) {
      navigate(returnTo, { replace: true })
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, navigate, returnTo])

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="w-full max-w-sm"
        >
          <GlassCard className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-soft ring-1 ring-coral/30">
              <Clock className="size-8 text-coral" />
            </div>
            <h1 className="display mt-4 text-xl font-bold text-ink">
              {isOverload ? 'Service warming up' : 'High civic traffic'}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {isOverload
                ? 'The server is temporarily busy. We\u2019re holding your spot — retrying automatically in a moment.'
                : 'You hit a rate limit. We\u2019re holding your spot — retrying automatically in a moment.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin text-coral" />
              <span className="display text-3xl font-bold text-coral tabular-nums">{seconds}s</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-rule">
              <motion.div
                className="h-full rounded-full bg-coral"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-4 text-[11px] font-semibold text-ink-muted">Retrying your request shortly…</p>
          </GlassCard>
          <div className="mt-6 flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={() => navigate(returnTo, { replace: true })}
              className="text-sm font-bold text-coral"
            >
              Try now
            </button>
            <Link to="/" className="text-sm font-semibold text-ink-muted">Back to home</Link>
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
