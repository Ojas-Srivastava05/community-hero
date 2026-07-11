import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Home, Layers, Search, Sparkles, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CivicMap } from '@/components/civic/CivicMap'
import { PlacesAutocomplete } from '@/components/civic/PlacesAutocomplete'
import { LiveIndicator } from '@/components/civic/LiveIndicator'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { VerificationBadges } from '@/components/civic/VerificationBadges'
import { Chip } from '@/components/civic/GlassCard'
import { MapExplorerSkeleton } from '@/components/PageSkeleton'
import { LanguagePicker } from '@/lib/i18n'
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
import { cn } from '@/lib/utils'

const MAP_CITIES = [
  { id: 'blr', label: 'Bengaluru', lat: 12.9716, lng: 77.5946, wardPrefix: 'BLR_WARD' },
  { id: 'del', label: 'Delhi', lat: 28.6329, lng: 77.2167, wardPrefix: 'DEL_WARD' },
  { id: 'mum', label: 'Mumbai', lat: 19.076, lng: 72.8777, wardPrefix: 'MUM_WARD' },
  { id: 'pun', label: 'Pune', lat: 18.5204, lng: 73.8567, wardPrefix: 'PUN_WARD' },
  { id: 'hyd', label: 'Hyderabad', lat: 17.385, lng: 78.4867, wardPrefix: 'HYD_WARD' },
  { id: 'all', label: 'All India', lat: 22.5, lng: 79.0, wardPrefix: '' },
] as const

type MapHotspot = {
  geohash: string
  lat: number
  lng: number
  count: number
  score: number
  predictive?: boolean
}

export function MapExplorerPage() {
  const [showHotspots, setShowHotspots] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [mapZoom, setMapZoom] = useState(12)
  const [activeCity, setActiveCity] = useState<string>('all')
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const [hotspots, setHotspots] = useState<MapHotspot[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  // Map explorer shows ALL public issues — no GPS radius (that hid 90% of multi-city demo data).
  const { issues, livePulse, loading, error } = useLiveIssues({
    fetchLimit: 200,
    preferApi: true,
  })
  const { selectedId, filter, categoryFilter, search, setSelectedId, setFilter, setCategoryFilter, setSearch } = useMapStore()
  const [previewDismissed, setPreviewDismissed] = useState(false)
  const initialSelectDone = useRef(false)

  const handleSelectIssue = (id: string) => {
    setPreviewDismissed(false)
    setSelectedId(id)
    const picked = filtered.find((i) => i.id === id) ?? issues.find((i) => i.id === id)
    if (picked) {
      setMapCenter({ lat: picked.lat, lng: picked.lng })
      setMapZoom(15)
    }
  }

  const jumpToCity = (cityId: string) => {
    const city = MAP_CITIES.find((c) => c.id === cityId) ?? MAP_CITIES[5]
    setActiveCity(cityId)
    setMapCenter({ lat: city.lat, lng: city.lng })
    setMapZoom(cityId === 'all' ? 5 : 13)
    setPreviewDismissed(false)
    setSelectedId(undefined)
    initialSelectDone.current = false
  }

  const handleDismissPreview = () => {
    setPreviewDismissed(true)
    setSelectedId(undefined)
  }

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

  const cityMeta = MAP_CITIES.find((c) => c.id === activeCity) ?? MAP_CITIES[5]

  const filtered = issues
    .filter((i) => {
      if (cityMeta.wardPrefix) return i.wardId?.startsWith(cityMeta.wardPrefix)
      return true
    })
    .filter((i) => {
      if (filter === 'resolved') return ['Resolved', 'Closed'].includes(i.status)
      if (filter === 'critical') return i.severity >= 5
      if (filter === 'high') return i.severity >= 4
      return true
    })
    .filter((i) => {
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
      return true
    })
    .filter((i) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return i.title.toLowerCase().includes(q) || (i.address || '').toLowerCase().includes(q)
    })

  useEffect(() => {
    if (initialSelectDone.current || previewDismissed) return
    if (filtered[0]?.id) {
      setSelectedId(filtered[0].id)
      initialSelectDone.current = true
    }
  }, [filtered, previewDismissed, setSelectedId])

  useEffect(() => {
    if (previewDismissed) return
    if (selectedId && filtered.length > 0 && !filtered.some((i) => i.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId, setSelectedId, previewDismissed])

  const issue = filtered.find((i) => i.id === selectedId) ?? filtered[0]

  const defaultCenter = mapCenter ?? { lat: 22.5, lng: 79.0 }

  const center = defaultCenter
  const hasActiveFilters = filter !== 'all' || categoryFilter !== 'all' || search.trim().length > 0
  const showEmptyMap = !loading && issues.length === 0
  const showNoMatches = !loading && issues.length > 0 && filtered.length === 0

  const toggleFilters = () => {
    setShowFilters((open) => {
      const next = !open
      if (next) {
        requestAnimationFrame(() => {
          filterPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }
      return next
    })
  }

  return (
    <AppShell bare>
      <div className="relative h-[calc(100dvh-env(safe-area-inset-bottom))] w-full">
        <CivicMap
          center={center}
          zoom={mapZoom}
          issues={filtered}
          hotspots={mapHotspots}
          showHotspotLayer={showHotspots}
          selectedId={selectedId}
          onSelect={handleSelectIssue}
          className="absolute inset-0 size-full"
        />
        {loading && issues.length === 0 && <MapExplorerSkeleton />}
        {showEmptyMap && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center p-8 pointer-events-none"
          >
            <div className="glass-strong max-w-xs rounded-3xl p-6 text-center pointer-events-auto">
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
        {showNoMatches && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-x-4 top-44 z-10 flex justify-center"
          >
            <div className="glass-strong max-w-sm rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-ink">No issues match your filters</p>
              <p className="mt-0.5 text-xs text-ink-muted">Try a different category, severity, or search term.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all')
                    setCategoryFilter('all')
                    setSearch('')
                  }}
                  className="mt-2 text-xs font-semibold text-coral"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="glass-strong flex items-center gap-1.5 rounded-2xl px-2.5 py-2">
            <Link
              to="/"
              aria-label="Back to home"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-rule"
            >
              <Home className="size-4 text-ink" />
            </Link>
            <Search className="size-4 shrink-0 text-ink-muted" />
            <PlacesAutocomplete
              value={search}
              onChange={setSearch}
              onPlaceSelect={({ lat, lng, address }) => {
                setMapCenter({ lat, lng })
                setSearch(address)
              }}
              placeholder="Search area or issue"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <LanguagePicker compact className="shrink-0" />
            <LiveIndicator active={livePulse} />
            <button
              type="button"
              aria-pressed={showFilters}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              onClick={toggleFilters}
              className={cn('grid size-8 shrink-0 place-items-center rounded-lg border border-rule', showFilters && 'bg-coral-soft text-coral')}
            >
              <Filter className="size-4 text-ink" />
            </button>
          </div>
          {showFilters && (
          <div ref={filterPanelRef}>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setFilter('all')}><Chip tone={filter === 'all' ? 'coral' : undefined}>All</Chip></button>
            <button type="button" onClick={() => setFilter('critical')}><Chip tone={filter === 'critical' ? 'danger' : undefined}>Critical</Chip></button>
            <button type="button" onClick={() => setFilter('high')}><Chip tone={filter === 'high' ? 'warn' : undefined}>High</Chip></button>
            <button type="button" onClick={() => setFilter('resolved')}><Chip tone={filter === 'resolved' ? 'ok' : undefined}>Resolved</Chip></button>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {MAP_CITIES.map((city) => (
              <button key={city.id} type="button" onClick={() => jumpToCity(city.id)}>
                <Chip tone={activeCity === city.id ? 'indigo' : undefined}>{city.label}</Chip>
              </button>
            ))}
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setCategoryFilter('all')}><Chip tone={categoryFilter === 'all' ? 'indigo' : undefined}>All types</Chip></button>
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}>
                <Chip tone={categoryFilter === cat ? 'indigo' : undefined}>{categoryLabel(cat)}</Chip>
              </button>
            ))}
          </div>
          </div>
          )}
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
          className={cn(
            'absolute right-3 z-20 grid size-11 place-items-center rounded-xl glass-strong',
            showFilters ? 'top-[10.5rem]' : 'top-[4.75rem]',
          )}
        >
          <Layers className="size-5 text-ink" />
        </motion.button>
        {!loading && (
          <div
            className={cn(
              'absolute left-3 z-20 rounded-full px-3 py-1.5 text-[11px] font-bold glass-strong',
              showFilters ? 'top-[10.5rem]' : 'top-[4.75rem]',
            )}
          >
            {error ? (
              <span className="text-coral">Could not load issues</span>
            ) : (
              <span className="text-ink">
                {filtered.length} of {issues.length} issue{issues.length === 1 ? '' : 's'}
                {activeCity !== 'all' ? ` · ${cityMeta.label}` : ''}
                {showHotspots ? ' · density overlay on' : ''}
              </span>
            )}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 px-3 pointer-events-none">
            <div className="pointer-events-auto glass-strong rounded-2xl p-2">
              <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                Tap an issue — colored dots are reports; purple rings are optional density overlay
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {filtered.slice(0, 24).map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => handleSelectIssue(i.id)}
                    className={cn(
                      'shrink-0 max-w-[11rem] truncate rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors',
                      selectedId === i.id
                        ? 'border-coral bg-coral-soft text-coral'
                        : 'border-rule bg-paper/80 text-ink hover:border-coral/40',
                    )}
                  >
                    {i.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {issue && !previewDismissed && (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+10.5rem)] z-50 px-3 pointer-events-none"
            >
              <div className="paper relative pointer-events-auto overflow-hidden shadow-lg">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink/20" />
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3">
                  <Link to={`/issues/${issue.id}`} className="contents">
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
                  </Link>
                  <button
                    type="button"
                    aria-label="Close preview"
                    onClick={handleDismissPreview}
                    className="grid size-8 place-items-center rounded-lg border border-rule"
                  >
                    <X className="size-4 text-ink" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
