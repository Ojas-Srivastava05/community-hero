import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

type Toast = { id: number; points: number; message?: string }

const PointsToastContext = createContext<{ showPoints: (points: number, message?: string) => void } | null>(null)

export function PointsToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showPoints = useCallback((points: number, message?: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, points, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  return (
    <PointsToastContext.Provider value={{ showPoints }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-5">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="flex items-center gap-2 rounded-full border border-coral/30 bg-paper/95 px-4 py-2.5 shadow-lg backdrop-blur-sm"
            >
              <Sparkles className="size-4 text-coral" />
              {t.points > 0 ? (
                <span className="text-sm font-bold text-coral">+{t.points} civic points</span>
              ) : (
                <span className="text-sm font-bold text-ink">{t.message || 'Saved'}</span>
              )}
              {t.points > 0 && t.message && <span className="text-xs text-ink-muted">{t.message}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PointsToastContext.Provider>
  )
}

export function usePointsToast() {
  const ctx = useContext(PointsToastContext)
  if (!ctx) throw new Error('usePointsToast must be used within PointsToastProvider')
  return ctx
}
