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

const STORAGE_KEY = 'ch-admin-region'

type AdminRegionValue = {
  regionId: AdminRegionId
  wardPrefix: string
  setRegionId: (id: AdminRegionId) => void
  matchesIssue: (wardId?: string) => boolean
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
    (wardId?: string) => {
      if (!wardPrefix) return true
      return wardId?.startsWith(wardPrefix) ?? false
    },
    [wardPrefix],
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
