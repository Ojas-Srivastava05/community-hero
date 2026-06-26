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
    <div className={cn('relative overflow-hidden bg-[#f5f0e8]', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e8754a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f5f0e8" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="#ddd5c8" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <rect width="100" height="100" fill="url(#mapGlow)" />
        <path d="M0 30 Q40 20 100 35" stroke="#cfc6b8" strokeWidth="1.4" fill="none" />
        <path d="M0 62 Q50 70 100 58" stroke="#cfc6b8" strokeWidth="1.2" fill="none" />
        <path d="M25 0 Q35 50 22 100" stroke="#cfc6b8" strokeWidth="1.2" fill="none" />
        <path d="M70 0 Q60 50 78 100" stroke="#cfc6b8" strokeWidth="1.4" fill="none" />
      </svg>
      {issues.map((i) => {
        const sev = apiSeverityToUi(i.severity)
        const color =
          sev === 'critical'
            ? 'oklch(0.55 0.24 22)'
            : sev === 'high'
              ? 'oklch(0.66 0.21 36)'
              : sev === 'med'
                ? 'oklch(0.72 0.17 75)'
                : 'oklch(0.58 0.16 150)'
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
                className={cn('relative grid size-4 place-items-center rounded-full ring-2 ring-paper transition-transform', active && 'scale-150')}
                style={{ background: color }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
