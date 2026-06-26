import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Layers, Search, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CivicMap } from '@/components/civic/CivicMap'
import { LiveIndicator } from '@/components/civic/LiveIndicator'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { Chip } from '@/components/civic/GlassCard'
import { useLocation } from '../lib/location'
import { useLiveIssues } from '../lib/use-live-issues'
import {
  apiSeverityToUi,
  issueArea,
  issueImage,
  issueReportedAt,
} from '@/lib/issue-ui'

export function MapExplorerPage() {
  const { location } = useLocation()
  const { issues, livePulse } = useLiveIssues({
    lat: location?.lat,
    lng: location?.lng,
    radiusKm: location ? 50 : undefined,
    fetchLimit: 100,
  })
  const [selected, setSelected] = useState<string | undefined>()
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'resolved'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSelected((prev) => prev ?? issues[0]?.id)
  }, [issues])

  const filtered = issues.filter((i) => {
    if (filter === 'resolved') return ['Resolved', 'Closed'].includes(i.status)
    if (filter === 'critical') return i.severity >= 5
    if (filter === 'high') return i.severity >= 4
    return true
  }).filter((i) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return i.title.toLowerCase().includes(q) || (i.address || '').toLowerCase().includes(q)
  })

  const issue = filtered.find((i) => i.id === selected) ?? filtered[0]

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
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="absolute inset-x-0 top-0 z-20 px-4 pt-4"
        >
          <div className="glass-strong flex items-center gap-2 rounded-2xl px-3 py-2.5">
            <Search className="size-4 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search area or issue"
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <LiveIndicator active={livePulse} />
            <button type="button" className="grid size-8 place-items-center rounded-lg border border-rule">
              <Filter className="size-4 text-ink" />
            </button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setFilter('all')}><Chip tone={filter === 'all' ? 'coral' : undefined}>All</Chip></button>
            <button type="button" onClick={() => setFilter('critical')}><Chip tone={filter === 'critical' ? 'danger' : undefined}>Critical</Chip></button>
            <button type="button" onClick={() => setFilter('high')}><Chip tone={filter === 'high' ? 'warn' : undefined}>High</Chip></button>
            <button type="button" onClick={() => setFilter('resolved')}><Chip tone={filter === 'resolved' ? 'ok' : undefined}>Resolved</Chip></button>
          </div>
        </motion.div>
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.92 }}
          className="absolute right-4 top-40 z-20 grid size-11 place-items-center rounded-xl glass-strong"
        >
          <Layers className="size-5 text-ink" />
        </motion.button>
        <AnimatePresence>
          {issue && (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="absolute inset-x-0 bottom-24 z-20 px-3"
            >
              <Link to={`/issues/${issue.id}`} className="paper relative block overflow-hidden">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink/20" />
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3">
                  <img src={issueImage(issue)} alt="" className="size-16 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
                    <p className="mt-1 truncate text-sm font-bold text-ink">{issue.title}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {issueArea(issue)} · {issue.upvoteCount} boosts · {issueReportedAt(issue)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={(e) => {
                      e.preventDefault()
                      setSelected(undefined)
                    }}
                    className="grid size-8 place-items-center rounded-lg border border-rule"
                  >
                    <X className="size-4 text-ink" />
                  </button>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
