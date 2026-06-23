import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

export function NotFoundPage() {
  return (
    <AppShell>
      <div className="px-5 py-24 text-center">
        <p className="text-6xl font-extrabold text-teal">404</p>
        <h1 className="mt-4 text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This route doesn&apos;t exist yet.</p>
        <Link to="/" className="mt-8 inline-block rounded-2xl bg-teal px-6 py-3 text-sm font-bold text-primary-foreground">
          Go home
        </Link>
      </div>
    </AppShell>
  )
}
