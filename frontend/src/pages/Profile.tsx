import { Link } from 'react-router-dom'
import { LogIn, LogOut, Trophy, FileText } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { GlassCard } from '../components/GlassCard'

export function ProfilePage() {
  const { user, signInWithGoogle, logout, signingIn } = useAuth()

  return (
    <div className="min-h-full px-6 pb-32 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-mist">Your civic identity & reports</p>
      </header>

      <div className="space-y-4">
        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/30 to-teal/5 text-2xl font-bold text-teal ring-1 ring-teal/20">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                user?.displayName?.[0] ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{user?.displayName ?? 'Guest'}</p>
              <p className="truncate text-sm text-mist">{user?.email ?? 'Sign in to report & track issues'}</p>
            </div>
          </div>
          <div className="relative mt-5">
            {user ? (
              <button type="button" onClick={() => logout()} className="btn-ghost flex w-full items-center justify-center gap-2">
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <button
                type="button"
                disabled={signingIn}
                onClick={() => signInWithGoogle()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                {signingIn ? 'Opening Google…' : 'Sign in with Google'}
              </button>
            )}
          </div>
        </GlassCard>

        {user && (
          <section className="grid grid-cols-2 gap-3">
            <Link to="/my-reports" className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.98]">
              <FileText size={20} className="text-teal" />
              <p className="mt-2 font-medium">My Reports</p>
              <p className="text-xs text-mist">Track your submissions</p>
            </Link>
            <Link to="/leaderboard" className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.98]">
              <Trophy size={20} className="text-gold" />
              <p className="mt-2 font-medium">Leaderboard</p>
              <p className="text-xs text-mist">Civic points & badges</p>
            </Link>
          </section>
        )}

        <Link to="/" className="btn-ghost block text-center">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
