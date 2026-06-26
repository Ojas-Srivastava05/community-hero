import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Shield, Sparkles, Trophy } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { fadeUp, stagger } from '../lib/motion'

const POINT_RULES = [
  { action: 'Submit a quality report', points: '+10', badge: 'First Reporter' },
  { action: 'Report reaches Community Verified (3 boosts)', points: '+15', badge: 'Neighborhood Voice' },
  { action: 'Confirm duplicate merge', points: '+15', badge: 'Duplicate Hunter' },
  { action: 'Boost a neighbor report (upvote)', points: '+5', badge: 'Verified Voice (50 boosts)' },
  { action: 'Your report gets resolved', points: '+25', badge: 'Fix Follower' },
  { action: '5 reports in one ward', points: '+20', badge: 'Ward Guardian' },
  { action: '7-day reporting streak', points: '+30', badge: 'Consistent Citizen' },
  { action: 'Reach 100 civic points', points: '—', badge: 'Civic Champion' },
] as const

const BADGES = [
  { name: 'First Reporter', desc: 'Submit your first civic report' },
  { name: 'Neighborhood Voice', desc: 'Earn 3 boosts on one of your reports' },
  { name: 'Duplicate Hunter', desc: 'Merge into an existing nearby report' },
  { name: 'Verified Voice', desc: 'Give 50 community boosts to neighbors' },
  { name: 'Fix Follower', desc: 'Have one of your reports marked resolved' },
  { name: 'Ward Guardian', desc: 'Submit 5 reports in the same ward' },
  { name: 'Civic Champion', desc: 'Reach 100+ civic points' },
] as const

export function GamificationRulesPage() {
  return (
    <AppShell>
      <PageHeader title="Gamification rules" subtitle="Appendix O — transparent civic points" />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-5 pt-4">
        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-coral" />
              <p className="text-sm font-bold text-ink">Ethics-first design</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Civic points reward real community action — not vanity metrics. Leaderboard is opt-in only.
              Badges are private by default and never affect issue credibility or routing priority.
            </p>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2">
              <Award className="size-4 text-coral" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Point economy</p>
            </div>
            <ul className="mt-3 space-y-2">
              {POINT_RULES.map((r) => (
                <li key={r.action} className="flex items-start justify-between gap-3 text-sm text-ink">
                  <div className="min-w-0">
                    <span>{r.action}</span>
                    <p className="text-[10px] text-ink-muted">{r.badge}</p>
                  </div>
                  <span className="shrink-0 font-bold text-coral">{r.points}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-coral" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Badges</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {BADGES.map((b) => (
                <div key={b.name} className="rounded-xl border border-rule bg-surface px-3 py-2.5">
                  <p className="text-xs font-bold text-coral">{b.name}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-ink-muted">{b.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-coral" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Anti-gaming</p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-ink-muted">
              <li>• Rate limits on reports and boosts</li>
              <li>• New accounts must report once before boosting</li>
              <li>• No public trust score on profiles</li>
              <li>• Streak bonus once per qualifying 7-day window</li>
            </ul>
          </GlassCard>
        </motion.div>

        <div className="flex flex-col gap-2 py-4">
          <Link to="/profile" className="text-center text-sm font-semibold text-coral">View your profile</Link>
          <Link to="/terms" className="text-center text-sm font-semibold text-ink-muted">Terms of use</Link>
        </div>
      </motion.div>
    </AppShell>
  )
}
