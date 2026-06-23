import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Layers, Search, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CivicMap } from '@/components/civic/CivicMap'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { Chip } from '@/components/civic/GlassCard'
import { apiListIssues } from '../lib/api'
import { useLocation } from '../lib/location'
import {
  apiSeverityToUi,
  issueArea,
  issueImage,
  issueReportedAt,
} from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

export function MapExplorerPage() {
  const { location } = useLocation()
  const [issues, setIssues] = useState<Issue[]>([])
  const [selected, setSelected] = useState<string | undefined>()
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'resolved'>('all')
  const issue = issues.find((i) => i.id === selected) ?? issues[0]

  useEffect(() => {
    const opts = location ? { lat: location.lat, lng: location.lng, radiusKm: 50 } : undefined
    apiListIssues(100, opts)
      .then((r) => {
        setIssues(r.issues)
        setSelected(r.issues[0]?.id)
      })
      .catch(() => {})
  }, [location])

  const filtered = issues.filter((i) => {
    if (filter === 'resolved') return ['Resolved', 'Closed'].includes(i.status)
    if (filter === 'critical') return i.severity >= 5
    if (filter === 'high') return i.severity >= 4
    return true
  })

  const center = location
    ? { lat: location.lat, lng: location.lng }
    : issues[0]
      ? { lat: issues[0].lat, lng: issues[0].lng }
      : { lat: 20, lng: 0 }

  return (
    <AppShell bare>
      <div className="relative h-screen w-full">
        <CivicMap
          center={center}
          issues={filtered}
          selectedId={selected}
          onSelect={setSelected}
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
          <div className="glass-strong flex items-center gap-2 rounded-2xl px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input placeholder="Search area or issue" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <button type="button" className="grid size-8 place-items-center rounded-lg border border-glass-border">
              <Filter className="size-4" />
            </button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setFilter('all')}><Chip tone={filter === 'all' ? 'teal' : undefined}>All</Chip></button>
            <button type="button" onClick={() => setFilter('critical')}><Chip tone={filter === 'critical' ? 'danger' : undefined}>Critical</Chip></button>
            <button type="button" onClick={() => setFilter('high')}><Chip tone={filter === 'high' ? 'warn' : undefined}>High</Chip></button>
            <button type="button" onClick={() => setFilter('resolved')}><Chip tone={filter === 'resolved' ? 'ok' : undefined}>Resolved</Chip></button>
          </div>
        </div>
        <button type="button" className="absolute right-4 top-40 z-20 grid size-11 place-items-center rounded-xl glass-strong">
          <Layers className="size-5" />
        </button>
        {issue && (
          <div className="absolute inset-x-0 bottom-24 z-20 px-3">
            <Link to={`/issues/${issue.id}`} className="glass-strong relative block overflow-hidden rounded-2xl">
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/40" />
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3">
                <img src={issueImage(issue)} alt="" className="size-16 rounded-xl object-cover" />
                <div className="min-w-0">
                  <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
                  <p className="mt-1 truncate text-sm font-bold">{issue.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {issueArea(issue)} · {issue.upvoteCount} upvotes · {issueReportedAt(issue)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelected(undefined)
                  }}
                  className="grid size-8 place-items-center rounded-lg border border-glass-border"
                >
                  <X className="size-4" />
                </button>
              </div>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
