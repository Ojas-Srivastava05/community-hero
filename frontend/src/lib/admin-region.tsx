import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AdminRegionId = 'all' | 'blr' | 'del' | 'mum' | 'pun' | 'hyd'

export const ADMIN_REGIONS: {
  id: AdminRegionId
  prefix: string
  labelKey: string
  demoNoteKey: string
}[] = [
  { id: 'all', prefix: '', labelKey: 'admin.region.all', demoNoteKey: 'admin.region.demoAll' },
  { id: 'blr', prefix: 'BLR_WARD', labelKey: 'admin.region.blr', demoNoteKey: 'admin.region.demoBlr' },
  { id: 'del', prefix: 'DEL_WARD', labelKey: 'admin.region.del', demoNoteKey: 'admin.region.demoDel' },
  { id: 'mum', prefix: 'MUM_WARD', labelKey: 'admin.region.mum', demoNoteKey: 'admin.region.demoMum' },
  { id: 'pun', prefix: 'PUN_WARD', labelKey: 'admin.region.pun', demoNoteKey: 'admin.region.demoPun' },
  { id: 'hyd', prefix: 'HYD_WARD', labelKey: 'admin.region.hyd', demoNoteKey: 'admin.region.demoHyd' },
]

/** Match seeded demo wards and live citizen reports by GPS (real reports use area-* wardIds). */
const REGION_BOUNDS: Record<
  Exclude<AdminRegionId, 'all'>,
  { latMin: number; latMax: number; lngMin: number; lngMax: number }
> = {
  blr: { latMin: 12.75, latMax: 13.15, lngMin: 77.35, lngMax: 77.85 },
  del: { latMin: 28.4, latMax: 28.85, lngMin: 76.95, lngMax: 77.45 },
  mum: { latMin: 18.9, latMax: 19.25, lngMin: 72.75, lngMax: 73.05 },
  pun: { latMin: 18.45, latMax: 18.65, lngMin: 73.75, lngMax: 73.95 },
  hyd: { latMin: 17.3, latMax: 17.55, lngMin: 78.35, lngMax: 78.65 },
}

const STORAGE_KEY = 'ch-admin-region'

export type AdminRegionMatch = {
  wardId?: string
  lat?: number
  lng?: number
  address?: string
}

function inRegionBounds(regionId: Exclude<AdminRegionId, 'all'>, lat: number, lng: number): boolean {
  const b = REGION_BOUNDS[regionId]
  return lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax
}

type AdminRegionValue = {
  regionId: AdminRegionId
  wardPrefix: string
  setRegionId: (id: AdminRegionId) => void
  matchesIssue: (issue: AdminRegionMatch) => boolean
}

const AdminRegionContext = createContext<AdminRegionValue | null>(null)

export function AdminRegionProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionIdState] = useState<AdminRegionId>(() => {
    if (typeof window === 'undefined') return 'all'
    const stored = localStorage.getItem(STORAGE_KEY) as AdminRegionId | null
    return ADMIN_REGIONS.some((r) => r.id === stored) ? stored! : 'all'
  })

  const setRegionId = useCallback((id: AdminRegionId) => {
    setRegionIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const wardPrefix = useMemo(
    () => ADMIN_REGIONS.find((r) => r.id === regionId)?.prefix ?? '',
    [regionId],
  )

  const matchesIssue = useCallback(
    (issue: AdminRegionMatch) => {
      if (regionId === 'all') return true
      if (wardPrefix && issue.wardId?.startsWith(wardPrefix)) return true
      if (issue.lat != null && issue.lng != null && Number.isFinite(issue.lat) && Number.isFinite(issue.lng)) {
        if (inRegionBounds(regionId, issue.lat, issue.lng)) return true
      }
      const addr = (issue.address || '').toLowerCase()
      if (addr) {
        const cityHints: Record<Exclude<AdminRegionId, 'all'>, string[]> = {
          blr: ['bengaluru', 'bangalore', 'blr', 'indiranagar', 'koramangala', 'chinnaswamy'],
          del: ['delhi', 'new delhi', 'ncr'],
          mum: ['mumbai', 'bombay'],
          pun: ['pune'],
          hyd: ['hyderabad'],
        }
        if (cityHints[regionId].some((h) => addr.includes(h))) return true
      }
      return false
    },
    [regionId, wardPrefix],
  )

  const value = useMemo(
    () => ({ regionId, wardPrefix, setRegionId, matchesIssue }),
    [regionId, wardPrefix, setRegionId, matchesIssue],
  )

  return <AdminRegionContext.Provider value={value}>{children}</AdminRegionContext.Provider>
}

export function useAdminRegion() {
  const ctx = useContext(AdminRegionContext)
  if (!ctx) throw new Error('useAdminRegion must be used within AdminRegionProvider')
  return ctx
}
