import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { apiSeverityToUi, type MapPoint } from '@/lib/issue-ui'
import type { MapHotspot } from './CivicMap'

/** Approximate degrees visible across the mock map width (report wizard ~h-48). */
const INTERACTIVE_VIEW_DEG = 0.014

function latLngToPercent(lat: number, lng: number, center: { lat: number; lng: number }) {
  const x = 50 + ((lng - center.lng) / INTERACTIVE_VIEW_DEG) * 100
  const y = 50 - ((lat - center.lat) / INTERACTIVE_VIEW_DEG) * 100
  return { left: `${Math.min(96, Math.max(4, x))}%`, top: `${Math.min(96, Math.max(4, y))}%` }
}

function clickToLatLng(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  center: { lat: number; lng: number },
) {
  const x = (clientX - rect.left) / rect.width
  const y = (clientY - rect.top) / rect.height
  return {
    lat: center.lat - (y - 0.5) * INTERACTIVE_VIEW_DEG,
    lng: center.lng + (x - 0.5) * INTERACTIVE_VIEW_DEG,
  }
}

export function MapMock({
  issues,
  hotspots = [],
  className,
  selectedId,
  onSelect,
  center,
  pinPosition,
  onMapClick,
  interactiveLabel,
}: {
  issues: MapPoint[]
  hotspots?: MapHotspot[]
  className?: string
  selectedId?: string
  onSelect?: (id: string) => void
  center?: { lat: number; lng: number }
  pinPosition?: { lat: number; lng: number }
  onMapClick?: (lat: number, lng: number) => void
  interactiveLabel?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const interactive = Boolean(onMapClick && center)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !center || !onMapClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const { lat, lng } = clickToLatLng(e.clientX, e.clientY, rect, center)
    onMapClick(lat, lng)
  }

  const pinStyle =
    interactive && pinPosition && center ? latLngToPercent(pinPosition.lat, pinPosition.lng, center) : null

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-[#f5f0e8]',
        interactive && 'cursor-crosshair',
        className,
      )}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && center && onMapClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onMapClick(center.lat, center.lng)
              }
            }
          : undefined
      }
      aria-label={interactive ? interactiveLabel || 'Tap to set report location' : undefined}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full">
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

      {interactive && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center px-2">
          <span className="rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-semibold text-ink-muted shadow-sm ring-1 ring-rule">
            {interactiveLabel || 'Tap map to drop pin'}
          </span>
        </div>
      )}

      {!interactive &&
        hotspots.map((h, idx) => (
          <span
            key={h.geohash}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${20 + (idx * 17) % 60}%`,
              top: `${25 + (idx * 23) % 50}%`,
            }}
            title={`${h.geohash}: ${h.count} open`}
          >
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full text-[10px] font-bold text-paper ring-2 ring-paper',
                h.predictive ? 'bg-coral/80' : 'bg-indigo/80',
              )}
            >
              {h.count > 99 ? '99+' : h.count}
            </span>
          </span>
        ))}

      {!interactive &&
        issues.map((i) => {
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
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(i.id)
              }}
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

      {pinStyle && (
        <span
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={pinStyle}
        >
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
            <path
              d="M16 2C10.5 2 6 6.5 6 12c0 7 10 18 10 18s10-11 10-18c0-5.5-4.5-10-10-10z"
              fill="#e8754a"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx="16" cy="12" r="4" fill="#fff" />
          </svg>
        </span>
      )}
    </div>
  )
}
