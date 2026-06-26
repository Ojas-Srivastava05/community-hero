import { create } from 'zustand'

type Hotspot = {
  geohash: string
  count: number
  recent: number
  score: number
  lat?: number
  lng?: number
  predictive?: boolean
}

type WardRow = { wardId: string; total: number; open: number; resolved: number }
type DeptSla = { departmentId: string; total: number; compliant: number; compliancePct: number | null }

type DashboardSummary = {
  total: number
  open: number
  resolved: number
  byCategory: Record<string, number>
  insight?: string
  avgResolutionHours?: number
  slaBreached?: number
  reportsPerDay?: { date: string; count: number }[]
  upvotesPerDay?: { date: string; count: number }[]
  wardBreakdown?: WardRow[]
  departmentSla?: DeptSla[]
}

type DashboardTrends = {
  narrative?: string
  avgResolutionHours?: number
  daily?: { date: string; open: number; resolved: number }[]
  daily30?: { date: string; count: number }[]
  categoryTrends?: Record<string, { last7: number; last30: number; prev7: number }>
  preventiveZones?: Hotspot[]
  seasonalWasteSpike?: { message?: string } | null
}

type DashboardState = {
  summary: DashboardSummary | null
  hotspots: Hotspot[]
  trends: DashboardTrends | null
  loading: boolean
  setSummary: (summary: DashboardSummary | null) => void
  setHotspots: (hotspots: Hotspot[]) => void
  setTrends: (trends: DashboardTrends | null) => void
  setLoading: (loading: boolean) => void
  loadAll: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  hotspots: [],
  trends: null,
  loading: true,
  setSummary: (summary) => set({ summary }),
  setHotspots: (hotspots) => set({ hotspots }),
  setTrends: (trends) => set({ trends }),
  setLoading: (loading) => set({ loading }),
  loadAll: async () => {
    set({ loading: true })
    try {
      const { apiAnalyticsSummary, apiHotspots, apiTrends } = await import('../lib/api')
      const [s, h, t] = await Promise.all([
        apiAnalyticsSummary(),
        apiHotspots().catch(() => ({ hotspots: [] })),
        apiTrends().catch(() => null),
      ])
      set({
        summary: {
          ...s,
          avgResolutionHours: s.avgResolutionHours ?? undefined,
        },
        hotspots: h.hotspots ?? [],
        trends: t,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },
}))

export type { Hotspot, WardRow, DeptSla, DashboardSummary, DashboardTrends }
