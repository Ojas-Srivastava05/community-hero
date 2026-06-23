import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'

type PlaceholderProps = {
  title: string
  phase: number
  description: string
}

export function PlaceholderPage({ title, phase, description }: PlaceholderProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 pb-32 pt-6 text-center">
      <GlassCard className="max-w-sm">
        <Construction size={40} className="mx-auto text-teal" />
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-mist">{description}</p>
        <p className="mt-4 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
          Coming in Phase {phase}
        </p>
        <Link to="/" className="btn-ghost mt-6 inline-block">
          Back to Home
        </Link>
      </GlassCard>
    </div>
  )
}
