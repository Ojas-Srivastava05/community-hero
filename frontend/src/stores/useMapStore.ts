import { create } from 'zustand'

export type MapFilter = 'all' | 'critical' | 'high' | 'resolved'

type MapState = {
  selectedId: string | undefined
  filter: MapFilter
  categoryFilter: string
  search: string
  setSelectedId: (id: string | undefined) => void
  setFilter: (filter: MapFilter) => void
  setCategoryFilter: (category: string) => void
  setSearch: (search: string) => void
  reset: () => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedId: undefined,
  filter: 'all',
  categoryFilter: 'all',
  search: '',
  setSelectedId: (selectedId) => set({ selectedId }),
  setFilter: (filter) => set({ filter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSearch: (search) => set({ search }),
  reset: () => set({ selectedId: undefined, filter: 'all', categoryFilter: 'all', search: '' }),
}))
