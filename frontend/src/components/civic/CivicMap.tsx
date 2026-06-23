import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { MapMock } from './MapMock'
import { issuesToMapPoints } from '@/lib/issue-ui'
import type { Issue } from '../../../../shared/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c2330' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
]

type CivicMapProps = {
  center: { lat: number; lng: number }
  issues: Issue[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
  zoom?: number
}

export function CivicMap({ center, issues, selectedId, onSelect, className, zoom = 14 }: CivicMapProps) {
  if (!MAPS_KEY || MAPS_KEY === 'your-api-key') {
    return (
      <MapMock
        issues={issuesToMapPoints(issues)}
        selectedId={selectedId}
        onSelect={onSelect}
        className={className}
      />
    )
  }

  return (
    <LoadScript googleMapsApiKey={MAPS_KEY}>
      <GoogleMap
        mapContainerClassName={className || 'size-full'}
        center={center}
        zoom={zoom}
        options={{ styles: mapStyle, disableDefaultUI: true, zoomControl: true }}
      >
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={{ lat: issue.lat, lng: issue.lng }}
            onClick={() => onSelect?.(issue.id)}
            opacity={selectedId && selectedId !== issue.id ? 0.6 : 1}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  )
}
