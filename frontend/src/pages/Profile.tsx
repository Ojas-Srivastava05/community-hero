import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, LogIn, LogOut, Database, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { getFirebaseDb } from '../lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { GlassCard } from '../components/GlassCard'

export function ProfilePage() {
  const { user, configured, signInWithGoogle, logout } = useAuth()
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle()
    } catch (err) {
      setTestStatus('error')
      setTestMessage(err instanceof Error ? err.message : 'Sign-in failed')
    }
  }

  async function runFirestoreTest() {
    const db = getFirebaseDb()
    if (!db || !user) return
    setTestStatus('loading')
    try {
      await addDoc(collection(db, 'health_checks'), {
        uid: user.uid,
        email: user.email,
        phase: 1,
        source: 'community-hero-pwa',
        createdAt: serverTimestamp(),
      })
      setTestStatus('success')
      setTestMessage('Firestore write succeeded — Phase 1 gate passed.')
    } catch (err) {
      setTestStatus('error')
      setTestMessage(err instanceof Error ? err.message : 'Write failed')
    }
  }

  return (
    <div className="min-h-full px-6 pb-32 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-mist">Phase 1 verification & account</p>
      </header>

      <div className="space-y-4">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 text-xl font-bold text-teal">
              {user?.displayName?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user?.displayName ?? 'Not signed in'}</p>
              <p className="text-sm text-mist">{user?.email ?? 'Sign in to sync reports'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {user ? (
              <button type="button" onClick={() => logout()} className="btn-ghost flex items-center gap-2">
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <button
                type="button"
                disabled={!configured}
                onClick={() => handleGoogleSignIn()}
                className="btn-primary flex items-center justify-center gap-2 !w-auto px-6"
              >
                <LogIn size={18} /> Google Sign-In
              </button>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="flex items-center gap-2 font-semibold">
            <Shield size={18} className="text-teal" />
            Phase 1 Verification
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <CheckItem ok={configured} label="Firebase env configured" />
            <CheckItem ok={!!user} label="Google Sign-In (login/logout)" />
            <CheckItem ok={testStatus === 'success'} label="Firestore write test" />
          </ul>

          {!configured && (
            <p className="mt-4 rounded-xl bg-high/10 p-3 text-xs text-high">
              Add Firebase keys to <code className="text-cloud">.env</code> — see README. Demo UI works without keys.
            </p>
          )}

          {user && configured && (
            <button
              type="button"
              onClick={runFirestoreTest}
              disabled={testStatus === 'loading'}
              className="btn-primary mt-4 flex items-center justify-center gap-2"
            >
              <Database size={18} />
              {testStatus === 'loading' ? 'Writing…' : 'Run Firestore Test'}
            </button>
          )}

          {testMessage && (
            <p className={`mt-3 text-sm ${testStatus === 'success' ? 'text-low' : 'text-critical'}`}>
              {testMessage}
            </p>
          )}
        </GlassCard>

        <Link to="/" className="btn-ghost block text-center">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-mist">
      {ok ? (
        <CheckCircle2 size={16} className="shrink-0 text-low" />
      ) : (
        <AlertCircle size={16} className="shrink-0 text-mist" />
      )}
      <span className={ok ? 'text-cloud' : ''}>{label}</span>
    </li>
  )
}
