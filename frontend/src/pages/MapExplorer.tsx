import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { List, Map as MapIcon } from 'lucide-react'
import { GlassCard, SeverityDot } from '../components/GlassCard'
import { apiListIssues } from '../lib/api'
import type { Issue } from '../../../shared/types'

const BENGALURU = { lat: 12.9352, lng: 77.6245 }
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || ''

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0F14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2733' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
]

function severityLevel(s: number): 'critical' | 'high' | 'medium' | 'low' {
  if (s >= 5) return 'critical'
  if (s >= 4) return 'high'
  if (s >= 3) return 'medium'
  return 'low'
}

export function MapExplorerPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [selected, setSelected] = useState<Issue | null>(null)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: mapsKey,
    id: 'community-hero-map',
  })

  useEffect(() => {
    apiListIssues(100)
      .then((r) => setIssues(r.issues))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const showMap = view === 'map' && mapsKey && isLoaded && !loadError

  return (
    <div className="min-h-full pb-32">
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Map Explorer</h1>
          <p className="text-xs text-mist">{issues.length} issues in Koramangala</p>
        </div>
        <button
          type="button"
          className="btn-ghost flex items-center gap-2 px-3 py-2 text-xs"
          onClick={() => setView(view === 'map' ? 'list' : 'map')}
        >
          {view === 'map' ? <List size={16} /> : <MapIcon size={16} />}
          {view === 'map' ? 'List' : 'Map'}
        </button>
      </header>

      {showMap ? (
        <div className="mx-4 overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ height: 'calc(100vh - 200px)' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={BENGALURU}
            zoom={14}
            options={{ styles: darkMapStyle, disableDefaultUI: true, zoomControl: true }}
          >
            {issues.map((issue) => (
              <Marker key={issue.id} position={{ lat: issue.lat, lng: issue.lng }} onClick={() => setSelected(issue)} />
            ))}
            {selected && (
              <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
                <div className="text-sm text-black">
                  <p className="font-semibold">{selected.title}</p>
                  <Link to={`/issues/${selected.id}`} className="text-teal">View details →</Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      ) : (
        <main className="space-y-3 px-6 pt-2">
          {view === 'map' && !isLoaded && mapsKey && !loadError && (
            <p className="text-center text-mist py-8">Loading map…</p>
          )}
          {issues.map((issue) => (
            <Link key={issue.id} to={`/issues/${issue.id}`}>
              <GlassCard className="flex gap-3 p-3 transition-transform active:scale-[0.99]">
                {issue.imageUrls?.[0] && (
                  <img src={issue.imageUrls[0]} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SeverityDot level={severityLevel(issue.severity)} />
                    <span className="text-[10px] uppercase tracking-wider text-mist">{issue.category.replace('_', ' ')}</span>
                  </div>
                  <p className="truncate font-medium">{issue.title}</p>
                  <p className="text-xs text-mist">{issue.status}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
          {loading && <p className="text-center text-mist py-8">Loading issues…</p>}
          {error && <p className="text-center text-critical py-8 text-sm">{error}</p>}
        </main>
      )}
    </div>
  )
}
