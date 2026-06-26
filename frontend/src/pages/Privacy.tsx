import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { fadeUp, stagger } from '../lib/motion'

const SECTIONS = [
  {
    title: 'Location data',
    body: 'We use your device GPS only to attach reports to real coordinates, reverse-geocode your area label, and show nearby issues. Location is not sold or shared with advertisers.',
  },
  {
    title: 'Photos & AI analysis',
    body: 'Report photos may be analyzed by AI to suggest category, severity, and department routing. Images are stored securely and shown to other users only as part of civic reports.',
  },
  {
    title: 'Account information',
    body: 'When you sign in with Google we store your display name, email, and profile photo to attribute reports and civic points. You can sign out at any time.',
  },
  {
    title: 'Leaderboard opt-in',
    body: 'Your name appears on the public leaderboard only when you enable leaderboard visibility in Profile settings. Civic points are always tracked for your account.',
  },
  {
    title: 'Data retention',
    body: 'Civic reports remain in the system to support transparency and SLA tracking. Resolved issues may include before/after proof photos uploaded by admins.',
  },
]

export function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Privacy policy" subtitle="How CivicPulse handles your data" />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-5 pt-4 pb-8">
        <motion.div variants={fadeUp}>
          <GlassCard className="flex items-start gap-3 border-coral/20 bg-coral-soft/20">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral/15 ring-1 ring-coral/30">
              <Shield className="size-5 text-coral" />
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">
              Community Hero (CivicPulse) is built for transparent civic reporting. This policy explains what we collect and why.
            </p>
          </GlassCard>
        </motion.div>
        {SECTIONS.map((s) => (
          <motion.div key={s.title} variants={fadeUp}>
            <GlassCard>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{s.body}</p>
            </GlassCard>
          </motion.div>
        ))}
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pt-2">
          <Link to="/terms" className="text-center text-sm font-semibold text-coral">Terms & gamification</Link>
          <Link to="/" className="text-center text-sm font-semibold text-ink-muted">Back to home</Link>
        </motion.div>
      </motion.div>
    </AppShell>
  )
}
