import { Check, Lock, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

const TIERS = [
  { label: 'Acknowledged', threshold: 1, level: 1, icon: Check, tone: 'indigo' as const },
  { label: 'Community Verified', threshold: 3, level: 2, icon: Users, tone: 'leaf' as const },
  { label: 'Priority', threshold: 10, level: 3, icon: Zap, tone: 'coral' as const },
]

function tierUnlocked(upvoteCount: number, verificationLevel: number, threshold: number, level: number) {
  return upvoteCount >= threshold || verificationLevel >= level
}

export function VerificationBadges({
  upvoteCount,
  verificationLevel,
}: {
  upvoteCount: number
  verificationLevel: number
}) {
  return (
    <GlassCard>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Community verification</p>
      <div className="mt-3 space-y-2">
        {TIERS.map((tier) => {
          const unlocked = tierUnlocked(upvoteCount, verificationLevel, tier.threshold, tier.level)
          const Icon = unlocked ? tier.icon : Lock
          const toneClass = {
            indigo: unlocked ? 'border-indigo/30 bg-indigo-soft text-indigo' : 'border-rule bg-surface text-ink-muted',
            leaf: unlocked ? 'border-leaf/30 bg-leaf-soft text-leaf' : 'border-rule bg-surface text-ink-muted',
            coral: unlocked ? 'border-coral/30 bg-coral-soft text-coral' : 'border-rule bg-surface text-ink-muted',
          }[tier.tone]
          return (
            <div
              key={tier.label}
              className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5', toneClass)}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper/60">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{tier.label}</p>
                <p className="text-[11px] opacity-80">
                  {unlocked ? 'Unlocked' : `${tier.threshold} boosts needed`}
                </p>
              </div>
              {unlocked && <Check className="size-4 shrink-0 opacity-70" />}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">{upvoteCount} community boost{upvoteCount === 1 ? '' : 's'}</p>
    </GlassCard>
  )
}
