import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type BeforeAfterSliderProps = {
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: BeforeAfterSliderProps) {
  const [pct, setPct] = useState(50)
  const trackRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const next = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPct(next)
  }, [])

  return (
    <div className={cn('select-none', className)}>
      <div
        ref={trackRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-rule bg-ink"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          onMove(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return
          onMove(e.clientX)
        }}
      >
        <img src={afterUrl} alt={afterLabel} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <img src={beforeUrl} alt={beforeLabel} className="h-full max-w-none object-cover" style={{ width: trackRef.current?.offsetWidth || '100%' }} />
        </div>
        <div className="absolute inset-y-0 z-10 w-0.5 bg-paper shadow-lg" style={{ left: `${pct}%` }}>
          <div className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-paper bg-coral text-[10px] font-bold text-paper">
            ⇔
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-bold text-paper">{beforeLabel}</span>
        <span className="absolute right-3 top-3 rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-bold text-paper">{afterLabel}</span>
      </div>
    </div>
  )
}
