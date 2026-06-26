import { create } from 'zustand'
import type { User } from 'firebase/auth'

type AuthState = {
  user: User | null
  loading: boolean
  signingIn: boolean
  configured: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setSigningIn: (signingIn: boolean) => void
  setConfigured: (configured: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signingIn: false,
  configured: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setSigningIn: (signingIn) => set({ signingIn }),
  setConfigured: (configured) => set({ configured }),
}))
