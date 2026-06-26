import { cn } from '@/lib/utils'

export function PageSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-3 px-5 pt-4', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="paper flex gap-3 p-4">
          <div className="size-12 shrink-0 rounded-xl bg-ink/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-ink/10" />
            <div className="h-2.5 w-1/2 rounded bg-ink/8" />
            <div className="h-2 w-1/3 rounded bg-ink/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="paper h-24 rounded-2xl bg-ink/5" />
        ))}
      </div>
      <div className="mt-6 h-48 rounded-[28px] bg-ink/5" />
      <div className="mt-6 h-56 rounded-[28px] bg-ink/5" />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-6" aria-busy="true" aria-label="Loading leaderboard">
      <div className="grid grid-cols-3 items-end gap-3">
        {[24, 32, 20].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="size-14 rounded-full bg-ink/10" />
            <div className="h-3 w-16 rounded bg-ink/10" />
            <div className={`mt-2 w-full rounded-t-xl bg-ink/8`} style={{ height: `${h * 4}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="paper h-14 rounded-2xl bg-ink/5" />
        ))}
      </div>
    </div>
  )
}

export function IssueDetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading issue">
      <div className="aspect-[5/6] w-full bg-ink/10" />
      <div className="space-y-4 px-5 pt-5">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 rounded-full bg-ink/10" />
          ))}
        </div>
        <div className="paper h-24 rounded-2xl bg-ink/5" />
        <div className="paper h-40 rounded-2xl bg-ink/5" />
      </div>
    </div>
  )
}

export function MapExplorerSkeleton() {
  return (
    <div className="absolute inset-0 z-10 animate-pulse bg-ink/5" aria-busy="true" aria-label="Loading map">
      <div className="absolute inset-x-4 top-4 h-12 rounded-2xl bg-ink/10" />
      <div className="absolute inset-x-3 bottom-24 h-24 rounded-2xl bg-ink/10" />
    </div>
  )
}
