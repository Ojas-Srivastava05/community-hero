import { cn } from '@/lib/utils'
import { apiSeverityToUi, type MapPoint } from '@/lib/issue-ui'

export function MapMock({
  issues,
  className,
  selectedId,
  onSelect,
}: {
  issues: MapPoint[]
  className?: string
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  return (
    <div className={cn('relative overflow-hidden bg-[#0a0e13]', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0a0e13" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="#1a2230" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <rect width="100" height="100" fill="url(#mapGlow)" />
        <path d="M0 30 Q40 20 100 35" stroke="#27313f" strokeWidth="1.4" fill="none" />
        <path d="M0 62 Q50 70 100 58" stroke="#27313f" strokeWidth="1.2" fill="none" />
        <path d="M25 0 Q35 50 22 100" stroke="#27313f" strokeWidth="1.2" fill="none" />
        <path d="M70 0 Q60 50 78 100" stroke="#27313f" strokeWidth="1.4" fill="none" />
      </svg>
      {issues.map((i) => {
        const sev = apiSeverityToUi(i.severity)
        const color =
          sev === 'critical' ? 'var(--sev-critical)' : sev === 'high' ? 'var(--sev-high)' : sev === 'med' ? 'var(--sev-med)' : 'var(--sev-low)'
        const active = selectedId === i.id
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => onSelect?.(i.id)}
            aria-label={i.title}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${i.mapLng}%`, top: `${i.mapLat}%` }}
          >
            <span className="relative grid place-items-center">
              <span className="absolute size-8 rounded-full opacity-40 animate-ping" style={{ background: color }} />
              <span
                className={cn('relative grid size-4 place-items-center rounded-full ring-2 ring-background transition-transform', active && 'scale-150')}
                style={{ background: color }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
