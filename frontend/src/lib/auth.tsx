import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from './firebase'
import { useAuthStore } from '../stores/useAuthStore'
import { apiDemoToken, apiEnsureUser } from './api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signingIn: boolean
  configured: boolean
  isAnonymous: boolean
  signInWithGoogle: () => Promise<void>
  signInWithDemo: (role: 'citizen' | 'admin') => Promise<void>
  signInAsGuest: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const signInLock = useRef(false)

  useEffect(() => {
    useAuthStore.getState().setConfigured(isFirebaseConfigured)
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      useAuthStore.getState().setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async (next) => {
      setUser(next)
      setLoading(false)
      useAuthStore.getState().setUser(next)
      useAuthStore.getState().setLoading(false)
      if (next) {
        try {
          const token = await next.getIdToken()
          await apiEnsureUser(token, {
            displayName: next.displayName || undefined,
            email: next.email || undefined,
            photoURL: next.photoURL || undefined,
          })
        } catch {
          /* non-blocking */
        }
      }
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (signInLock.current) return
    signInLock.current = true
    setSigningIn(true)
    useAuthStore.getState().setSigningIn(true)
    try {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured')
      await signInWithPopup(auth, googleProvider)
    } finally {
      signInLock.current = false
      setSigningIn(false)
      useAuthStore.getState().setSigningIn(false)
    }
  }, [])

  const signInWithDemo = useCallback(async (role: 'citizen' | 'admin') => {
    if (signInLock.current) return
    signInLock.current = true
    setSigningIn(true)
    useAuthStore.getState().setSigningIn(true)
    try {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured')
      const { token } = await apiDemoToken(role)
      await signInWithCustomToken(auth, token)
      const signedIn = auth.currentUser
      if (signedIn) await signedIn.getIdToken(true)
    } finally {
      signInLock.current = false
      setSigningIn(false)
      useAuthStore.getState().setSigningIn(false)
    }
  }, [])

  const signInAsGuest = useCallback(async () => {
    if (signInLock.current) return
    signInLock.current = true
    setSigningIn(true)
    useAuthStore.getState().setSigningIn(true)
    try {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured')
      await signInAnonymously(auth)
    } finally {
      signInLock.current = false
      setSigningIn(false)
      useAuthStore.getState().setSigningIn(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signingIn,
      configured: isFirebaseConfigured,
      isAnonymous: Boolean(user?.isAnonymous),
      signInWithGoogle,
      signInWithDemo,
      signInAsGuest,
      logout,
    }),
    [user, loading, signingIn, signInWithGoogle, signInWithDemo, signInAsGuest, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
