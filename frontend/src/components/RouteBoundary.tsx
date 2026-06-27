import type { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

/** Isolates route-level render errors so navigation stays usable. */
export function RouteBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
