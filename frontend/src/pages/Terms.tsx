import { Link } from 'react-router-dom'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'

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
      <div className="space-y-4 px-5 pt-4">
        <GlassCard>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Community Hero is a location-based civic reporting app. Reports use your device GPS and reverse geocoding — not a fixed city.
            You can report issues anywhere the app is available.
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Civic points</p>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r.action} className="flex items-center justify-between text-sm">
                <span>{r.action}</span>
                <span className="font-bold text-teal">{r.points}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Privacy</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Location is used only to attach reports to real coordinates and show nearby issues. Photos may be analyzed by AI for category and severity.
          </p>
        </GlassCard>
        <Link to="/" className="block py-4 text-center text-sm font-semibold text-teal">Back to home</Link>
      </div>
    </AppShell>
  )
}
