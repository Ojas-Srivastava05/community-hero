import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'

export function NotFoundPage() {
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-24 text-center"
      >
        <p className="display text-6xl font-bold text-coral">404</p>
        <h1 className="mt-4 text-xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">This page isn&apos;t part of Community Hero.</p>
        <Link to="/" className="mt-8 inline-block rounded-2xl bg-coral px-6 py-3 text-sm font-bold text-paper ink-glow">
          Go home
        </Link>
      </motion.div>
    </AppShell>
  )
}
