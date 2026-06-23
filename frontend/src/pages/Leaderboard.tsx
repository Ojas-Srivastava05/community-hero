import { useEffect, useState } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'
import { apiLeaderboard } from '../lib/api'

type User = { uid: string; civicPoints: number; displayName: string; badges: string[] }

export function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    apiLeaderboard().then((r) => setUsers(r.users)).catch(() => {})
  }, [])

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 px-6 py-4 text-center">
        <Trophy className="mx-auto text-gold mb-2" size={32} />
        <h1 className="text-lg font-semibold">Civic Leaderboard</h1>
        <p className="text-xs text-mist">Top reporters in Koramangala ward</p>
      </header>
      <main className="space-y-2 px-6 pt-4">
        {users.map((u, i) => (
          <GlassCard key={u.uid} className="flex items-center gap-4 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-sm font-bold text-teal">
              {i < 3 ? <Medal size={18} /> : i + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium">{u.displayName}</p>
              {u.badges?.length > 0 && (
                <p className="text-[10px] text-mist">{u.badges.join(' · ')}</p>
              )}
            </div>
            <span className="text-lg font-bold tabular-nums text-teal">{u.civicPoints}</span>
          </GlassCard>
        ))}
        {users.length === 0 && <p className="text-center text-mist py-8">No points yet — report an issue!</p>}
      </main>
    </div>
  )
}
