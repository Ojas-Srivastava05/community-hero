import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Trophy } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { apiLeaderboard } from '../lib/api'
import { fadeUp, stagger } from '../lib/motion'
import { cn } from '@/lib/utils'

type User = { uid: string; civicPoints: number; displayName: string; badges: string[] }

export function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    apiLeaderboard().then((r) => setUsers(r.users)).catch(() => {})
  }, [])

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1, name: u.displayName, points: u.civicPoints, ward: u.badges?.length ? `${u.badges.length} badges` : 'Civic reporter', reports: 0 }))
  const [first, second, third, ...rest] = ranked

  return (
    <AppShell>
      <PageHeader title="Leaderboard" subtitle="Top citizens · opt-in only" />
      {ranked.length >= 3 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-6"
        >
          <div className="grid grid-cols-3 items-end gap-3">
            <Podium person={second} height="h-24" rank={2} />
            <Podium person={first} height="h-32" rank={1} highlight />
            <Podium person={third} height="h-20" rank={3} />
          </div>
        </motion.section>
      )}
      <motion.section variants={stagger} initial="hidden" animate="show" className="mt-6 space-y-2 px-5">
        {rest.map((p) => (
          <motion.div key={p.uid} variants={fadeUp}>
            <GlassCard className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <span className="grid size-7 place-items-center rounded-lg border border-rule bg-surface text-xs font-bold text-ink-muted">{p.rank}</span>
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-coral/30 to-coral/5 text-xs font-bold text-coral">{initials(p.name)}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                <p className="truncate text-[11px] text-ink-muted">{p.ward}</p>
              </div>
              <span className="text-sm font-extrabold text-coral">{p.points.toLocaleString()}</span>
            </GlassCard>
          </motion.div>
        ))}
        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-muted">
            No opt-in champions yet — earn points and enable leaderboard visibility in{' '}
            <Link to="/profile" className="text-coral">Profile</Link>.
          </p>
        )}
      </motion.section>
    </AppShell>
  )
}

function Podium({ person, height, rank, highlight }: { person: { name: string; points: number }; height: string; rank: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {highlight && <Crown className="size-5 text-amber" fill="currentColor" />}
      <div className={cn('grid size-14 place-items-center rounded-full text-sm font-extrabold', highlight ? 'bg-gradient-to-br from-coral/50 to-coral/10 text-coral ring-2 ring-coral/50 ink-glow' : 'border border-rule bg-paper text-ink')}>
        {initials(person.name)}
      </div>
      <p className="mt-2 max-w-full truncate text-xs font-bold text-ink">{person.name}</p>
      <p className="text-[10px] text-ink-muted">{person.points.toLocaleString()} pts</p>
      <div className={cn('mt-2 grid w-full place-items-center rounded-t-xl border border-b-0 border-rule bg-paper text-xs font-extrabold', height, highlight && 'bg-coral-soft border-coral/30 text-coral')}>
        <div className="flex flex-col items-center gap-1"><Trophy className="size-3.5 opacity-60" />#{rank}</div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
}
