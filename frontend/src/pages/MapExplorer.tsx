import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Layers, Search, Sparkles, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CivicMap } from '@/components/civic/CivicMap'
import { LiveIndicator } from '@/components/civic/LiveIndicator'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { Chip } from '@/components/civic/GlassCard'
import { MapExplorerSkeleton } from '@/components/PageSkeleton'
import { useLocation } from '../lib/location'
import { apiHotspots } from '../lib/api'
import { useLiveIssues } from '../lib/use-live-issues'
import { useMapStore } from '../stores/useMapStore'
import {
  apiSeverityToUi,
  categoryLabel,
  issueArea,
  issueImage,
  issueReportedAt,
} from '@/lib/issue-ui'
import { CATEGORIES } from '../../../shared/types'

type MapHotspot = {
  geohash: string
  lat: number
  lng: number
  count: number
  score: number
  predictive?: boolean
}

export function MapExplorerPage() {
  const { location } = useLocation()
  const [showHotspots, setShowHotspots] = useState(true)
  const [hotspots, setHotspots] = useState<MapHotspot[]>([])
  const { issues, livePulse, loading } = useLiveIssues({
    lat: location?.lat,
    lng: location?.lng,
    radiusKm: location ? 50 : undefined,
    fetchLimit: 100,
  })
  const { selectedId, filter, categoryFilter, search, setSelectedId, setFilter, setCategoryFilter, setSearch } = useMapStore()

  useEffect(() => {
    if (!selectedId && issues[0]?.id) setSelectedId(issues[0].id)
  }, [issues, selectedId, setSelectedId])

  useEffect(() => {
    apiHotspots()
      .then((h) =>
        setHotspots(
          (h.hotspots ?? [])
            .filter((x) => x.lat && x.lng)
            .map((x) => ({
              geohash: x.geohash,
              lat: x.lat,
              lng: x.lng,
              count: x.count,
              score: x.score,
              predictive: x.predictive,
            })),
        ),
      )
      .catch(() => setHotspots([]))
  }, [])

  const mapHotspots = showHotspots ? hotspots : []

  const filtered = issues.filter((i) => {
    if (filter === 'resolved') return ['Resolved', 'Closed'].includes(i.status)
    if (filter === 'critical') return i.severity >= 5
    if (filter === 'high') return i.severity >= 4
    return true
  }).filter((i) => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
    return true
  }).filter((i) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return i.title.toLowerCase().includes(q) || (i.address || '').toLowerCase().includes(q)
  })

  const issue = filtered.find((i) => i.id === selectedId) ?? filtered[0]

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
          hotspots={mapHotspots}
          selectedId={selectedId}
          onSelect={setSelectedId}
          className="absolute inset-0 size-full"
        />
        {loading && issues.length === 0 && <MapExplorerSkeleton />}
        {issues.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center p-8"
          >
            <div className="glass-strong max-w-xs rounded-3xl p-6 text-center">
              <Sparkles className="mx-auto size-8 text-coral" />
              <p className="display mt-3 text-lg font-bold text-ink">Be the first reporter</p>
              <p className="mt-1 text-sm text-ink-muted">No civic issues mapped here yet. Snap a photo and help your neighbourhood.</p>
              <Link
                to="/report"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-coral px-5 text-sm font-bold text-paper ink-glow"
              >
                Report an issue
              </Link>
            </div>
          </motion.div>
        )}
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
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setCategoryFilter('all')}><Chip tone={categoryFilter === 'all' ? 'indigo' : undefined}>All types</Chip></button>
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}>
                <Chip tone={categoryFilter === cat ? 'indigo' : undefined}>{categoryLabel(cat)}</Chip>
              </button>
            ))}
          </div>
        </motion.div>
        <motion.button
          type="button"
          onClick={() => setShowHotspots((v) => !v)}
          aria-pressed={showHotspots}
          aria-label={showHotspots ? 'Hide hotspot overlay' : 'Show hotspot overlay'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.92 }}
          className="absolute right-4 top-52 z-20 grid size-11 place-items-center rounded-xl glass-strong"
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
                  <img src={issueImage(issue)} alt={`${issue.title} — ${issue.category.replace(/_/g, ' ')}`} className="size-16 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SeverityBadge severity={apiSeverityToUi(issue.severity)} />
                      <VerificationBadges
                        upvoteCount={issue.upvoteCount}
                        verificationLevel={issue.verificationLevel}
                        compact
                      />
                    </div>
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
                      setSelectedId(undefined)
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
