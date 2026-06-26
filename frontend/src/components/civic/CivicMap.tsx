import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { MapMock } from './MapMock'
import { issuesToMapPoints } from '@/lib/issue-ui'
import type { Issue } from '../../../../shared/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5c5670' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0e8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ebe4d8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e0d8cc' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d8cfc0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dce8' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eae3d7' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dce8d4' }] },
]

type CivicMapProps = {
  center: { lat: number; lng: number }
  issues: Issue[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
  zoom?: number
}

function severityMarkerColor(severity: number): string {
  if (severity >= 5) return '#c0392b'
  if (severity >= 4) return '#e8754a'
  if (severity >= 3) return '#d4a017'
  if (severity >= 2) return '#c9b458'
  return '#3d9970'
}

function severityMarkerIcon(severity: number, dimmed: boolean): string {
  const color = severityMarkerColor(severity)
  const r = dimmed ? 8 : 10
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="${r}" fill="${color}" stroke="#fff" stroke-width="2.5" opacity="${dimmed ? 0.65 : 1}"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
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
        {issues.map((issue) => {
          const dimmed = Boolean(selectedId && selectedId !== issue.id)
          return (
            <Marker
              key={issue.id}
              position={{ lat: issue.lat, lng: issue.lng }}
              onClick={() => onSelect?.(issue.id)}
              icon={severityMarkerIcon(issue.severity, dimmed)}
            />
          )
        })}
      </GoogleMap>
    </LoadScript>
  )
}
