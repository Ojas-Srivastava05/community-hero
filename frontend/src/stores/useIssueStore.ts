import { create } from 'zustand'
import type { Issue } from '../../../shared/types'

type IssueState = {
  issues: Issue[]
  loading: boolean
  livePulse: boolean
  setIssues: (issues: Issue[]) => void
  setLoading: (loading: boolean) => void
  setLivePulse: (livePulse: boolean) => void
  upsertIssue: (issue: Issue) => void
}

export const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  loading: false,
  livePulse: false,
  setIssues: (issues) => set({ issues }),
  setLoading: (loading) => set({ loading }),
  setLivePulse: (livePulse) => set({ livePulse }),
  upsertIssue: (issue) =>
    set((state) => {
      const idx = state.issues.findIndex((i) => i.id === issue.id)
      if (idx === -1) return { issues: [issue, ...state.issues] }
      const next = [...state.issues]
      next[idx] = issue
      return { issues: next }
    }),
}))
