import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-coral-soft text-coral">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="display text-lg font-bold text-ink">Something went wrong</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            {this.state.error.message || 'An unexpected error occurred. Try refreshing the page.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-2 rounded-xl bg-coral px-4 py-2 text-sm font-bold text-paper"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
