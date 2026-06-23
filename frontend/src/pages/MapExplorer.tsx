import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { Filter, List } from 'lucide-react'
import { GlassCard, SeverityDot } from '../components/GlassCard'
import { apiListIssues } from '../lib/api'
import type { Issue } from '../../../shared/types'

const BENGALURU = { lat: 12.9352, lng: 77.6245 }
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

function severityLevel(s: number): 'critical' | 'high' | 'medium' | 'low' {
  if (s >= 5) return 'critical'
  if (s >= 4) return 'high'
  if (s >= 3) return 'medium'
  return 'low'
}

export function MapExplorerPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selected, setSelected] = useState<Issue | null>(null)
  const [filter] = useState<string>('all')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapsKey,
    id: 'community-hero-map',
  })

  useEffect(() => {
    setLoading(true)
    apiListIssues(100)
      .then((r) => setIssues(r.issues))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return issues
    return issues.filter((i) => i.category === filter)
  }, [issues, filter])

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold">Map Explorer</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost p-2" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
            {view === 'map' ? <List size={18} /> : <Filter size={18} />}
          </button>
        </div>
      </header>

      {view === 'map' && mapsKey && isLoaded ? (
        <div className="h-[calc(100vh-180px)]">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={BENGALURU}
            zoom={14}
            options={{
              styles: [{ elementType: 'geometry', stylers: [{ color: '#0B0F14' }] }],
              disableDefaultUI: true,
            }}
          >
            {filtered.map((issue) => (
              <Marker
                key={issue.id}
                position={{ lat: issue.lat, lng: issue.lng }}
                onClick={() => setSelected(issue)}
              />
            ))}
            {selected && (
              <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
                <div className="text-black text-sm">
                  <p className="font-semibold">{selected.title}</p>
                  <Link to={`/issues/${selected.id}`} className="text-teal">View details</Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      ) : (
        <main className="space-y-3 px-6 pt-2">
          {!mapsKey && (
            <p className="text-xs text-mist mb-2">Add VITE_GOOGLE_MAPS_API_KEY for live map. Showing list view.</p>
          )}
          {filtered.map((issue) => (
            <Link key={issue.id} to={`/issues/${issue.id}`}>
              <GlassCard className="flex gap-3 p-3">
                {issue.imageUrls?.[0] && (
                  <img src={issue.imageUrls[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SeverityDot level={severityLevel(issue.severity)} />
                    <span className="text-[10px] uppercase text-mist">{issue.category}</span>
                  </div>
                  <p className="truncate font-medium">{issue.title}</p>
                  <p className="text-xs text-mist">{issue.status}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
          {loading && <p className="text-center text-mist py-8">Loading issues…</p>}
          {error && <p className="text-center text-critical py-8 text-sm">{error}</p>}
          {!loading && !error && filtered.length === 0 && <p className="text-center text-mist py-8">No issues yet. Be the first to report!</p>}
        </main>
      )}
    </div>
  )
}
