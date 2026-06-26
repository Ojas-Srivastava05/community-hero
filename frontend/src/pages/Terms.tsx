import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { fadeUp, stagger } from '../lib/motion'

const RULES = [
  { action: 'Submit a report', points: '+10' },
  { action: 'Report reaches 3 upvotes', points: '+15' },
  { action: 'Merge into duplicate', points: '+15' },
  { action: 'Upvote a neighbor report', points: '+5' },
  { action: 'Issue you reported gets resolved', points: '+25' },
]

export function TermsPage() {
  return (
    <AppShell>
      <PageHeader title="Terms & points" subtitle="How Community Hero works" />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-5 pt-4">
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-sm leading-relaxed text-ink-muted">
              Community Hero is a location-based civic reporting app. Reports use your device GPS and reverse geocoding — not a fixed city.
              You can report issues anywhere the app is available.
            </p>
          </GlassCard>
        </motion.div>
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Civic points</p>
            <ul className="mt-3 space-y-2">
              {RULES.map((r) => (
                <li key={r.action} className="flex items-center justify-between text-sm text-ink">
                  <span>{r.action}</span>
                  <span className="font-bold text-coral">{r.points}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>
        <motion.div variants={fadeUp}>
          <GlassCard>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Privacy</p>
            <p className="mt-2 text-sm text-ink-muted">
              Location is used only to attach reports to real coordinates and show nearby issues. Photos may be analyzed by AI for category and severity.
            </p>
            <Link to="/gamification-rules" className="mt-3 inline-block text-sm font-bold text-coral">Full gamification rules</Link>
            <Link to="/privacy" className="mt-2 block text-sm font-semibold text-ink-muted">Privacy policy</Link>
          </GlassCard>
        </motion.div>
        <Link to="/" className="block py-4 text-center text-sm font-semibold text-coral">Back to home</Link>
      </motion.div>
    </AppShell>
  )
}
