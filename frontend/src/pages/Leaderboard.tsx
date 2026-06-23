import { useEffect, useState } from 'react'
import { Crown, Trophy } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { apiLeaderboard } from '../lib/api'
import { cn } from '@/lib/utils'

type User = { uid: string; civicPoints: number; displayName: string; badges: string[] }

export function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    apiLeaderboard().then((r) => setUsers(r.users)).catch(() => {})
  }, [])

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1, name: u.displayName, points: u.civicPoints, ward: u.badges?.[0] || 'Koramangala', reports: 0 }))
  const [first, second, third, ...rest] = ranked

  return (
    <AppShell>
      <PageHeader title="Leaderboard" subtitle="Top citizens" />
      {ranked.length >= 3 && (
        <section className="px-5 pt-6">
          <div className="grid grid-cols-3 items-end gap-3">
            <Podium person={second} height="h-24" rank={2} />
            <Podium person={first} height="h-32" rank={1} highlight />
            <Podium person={third} height="h-20" rank={3} />
          </div>
        </section>
      )}
      <section className="mt-6 space-y-2 px-5">
        {rest.map((p) => (
          <GlassCard key={p.uid} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
            <span className="grid size-7 place-items-center rounded-lg border border-glass-border bg-glass text-xs font-bold text-muted-foreground">{p.rank}</span>
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal/30 to-teal/5 text-xs font-bold text-teal">{initials(p.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{p.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{p.ward}</p>
            </div>
            <span className="text-sm font-extrabold text-teal">{p.points.toLocaleString()}</span>
          </GlassCard>
        ))}
        {users.length === 0 && <p className="py-12 text-center text-muted-foreground">No points yet — report an issue!</p>}
      </section>
    </AppShell>
  )
}

function Podium({ person, height, rank, highlight }: { person: { name: string; points: number }; height: string; rank: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {highlight && <Crown className="size-5 text-sev-med" fill="currentColor" />}
      <div className={cn('grid size-14 place-items-center rounded-full text-sm font-extrabold', highlight ? 'bg-gradient-to-br from-teal/50 to-teal/10 text-teal ring-2 ring-teal/50 teal-glow' : 'border border-glass-border bg-glass')}>
        {initials(person.name)}
      </div>
      <p className="mt-2 max-w-full truncate text-xs font-bold">{person.name}</p>
      <p className="text-[10px] text-muted-foreground">{person.points.toLocaleString()} pts</p>
      <div className={cn('mt-2 grid w-full place-items-center rounded-t-xl border border-b-0 border-glass-border bg-glass text-xs font-extrabold', height, highlight && 'bg-teal/15 border-teal/40 text-teal')}>
        <div className="flex flex-col items-center gap-1"><Trophy className="size-3.5 opacity-60" />#{rank}</div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
}
