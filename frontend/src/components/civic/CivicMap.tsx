import { useEffect, useRef, useState } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { MapMock } from './MapMock'
import { useGoogleMaps } from './GoogleMapsProvider'
import { issuesToMapPoints } from '@/lib/issue-ui'
import type { Issue } from '../../../../shared/types'

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

export type MapHotspot = {
  geohash: string
  lat: number
  lng: number
  count: number
  score: number
  predictive?: boolean
}

type CivicMapProps = {
  center: { lat: number; lng: number }
  issues: Issue[]
  hotspots?: MapHotspot[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
  zoom?: number
  /** Click map to set a draft pin (ReportWizard confirm step). */
  onMapClick?: (lat: number, lng: number) => void
  /** Highlight user-adjusted pin separate from issue markers. */
  pinPosition?: { lat: number; lng: number }
}

export function severityMarkerColor(severity: number): string {
  if (severity >= 5) return '#c0392b'
  if (severity >= 4) return '#e8754a'
  if (severity >= 3) return '#d4a017'
  if (severity >= 2) return '#c9b458'
  return '#3d9970'
}

function severityMarkerIcon(severity: number, dimmed: boolean): google.maps.Icon | string {
  const color = severityMarkerColor(severity)
  const r = dimmed ? 8 : 10
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="${r}" fill="${color}" stroke="#fff" stroke-width="2.5" opacity="${dimmed ? 0.65 : 1}"/></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(24, 24),
    anchor: new google.maps.Point(12, 12),
  }
}

function pinDropIcon(): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M16 2C10.5 2 6 6.5 6 12c0 7 10 18 10 18s10-11 10-18c0-5.5-4.5-10-10-10z" fill="#e8754a" stroke="#fff" stroke-width="2"/><circle cx="16" cy="12" r="4" fill="#fff"/></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 32),
  }
}

function hotspotMarkerIcon(predictive: boolean): google.maps.Icon {
  const color = predictive ? '#c0392b' : '#6c5ce7'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="11" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/><circle cx="14" cy="14" r="4" fill="${color}"/></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(28, 28),
    anchor: new google.maps.Point(14, 14),
  }
}

function HotspotMarkers({ map, hotspots }: { map: google.maps.Map; hotspots: MapHotspot[] }) {
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = hotspots.map((h) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: h.lat, lng: h.lng },
        icon: hotspotMarkerIcon(Boolean(h.predictive)),
        zIndex: h.predictive ? 900 : 500,
        title: `${h.geohash}: ${h.count} open (score ${h.score})`,
      })
      return marker
    })
    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
    }
  }, [map, hotspots])

  return null
}

function ClusteredMarkers({
  map,
  issues,
  selectedId,
  onSelect,
}: {
  map: google.maps.Map
  issues: Issue[]
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    clustererRef.current?.clearMarkers()

    const markers = issues.map((issue) => {
      const dimmed = Boolean(selectedId && selectedId !== issue.id)
      const marker = new google.maps.Marker({
        position: { lat: issue.lat, lng: issue.lng },
        icon: severityMarkerIcon(issue.severity, dimmed),
        title: issue.title,
        zIndex: selectedId === issue.id ? 1000 : issue.severity * 10,
      })
      marker.addListener('click', () => {
        onSelect?.(issue.id)
        map.panTo({ lat: issue.lat, lng: issue.lng })
        if ((map.getZoom() ?? 14) < 16) map.setZoom(16)
      })
      return marker
    })

    markersRef.current = markers
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
    })

    return () => {
      clustererRef.current?.clearMarkers()
      markersRef.current.forEach((m) => m.setMap(null))
    }
  }, [map, issues, selectedId, onSelect])

  return null
}

function DraftPin({ map, position }: { map: google.maps.Map; position: { lat: number; lng: number } }) {
  const markerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    markerRef.current?.setMap(null)
    markerRef.current = new google.maps.Marker({
      map,
      position,
      icon: pinDropIcon(),
      zIndex: 2000,
      animation: google.maps.Animation.DROP,
    })
    return () => {
      markerRef.current?.setMap(null)
    }
  }, [map, position.lat, position.lng])

  return null
}

function MapClickHandler({
  map,
  onMapClick,
}: {
  map: google.maps.Map
  onMapClick?: (lat: number, lng: number) => void
}) {
  useEffect(() => {
    if (!onMapClick) return
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat()
      const lng = e.latLng?.lng()
      if (lat !== undefined && lng !== undefined) onMapClick(lat, lng)
    })
    return () => google.maps.event.removeListener(listener)
  }, [map, onMapClick])

  return null
}

function PanToCenter({ map, center }: { map: google.maps.Map; center: { lat: number; lng: number } }) {
  useEffect(() => {
    map.panTo(center)
  }, [map, center.lat, center.lng])

  return null
}

export function CivicMap({
  center,
  issues,
  hotspots = [],
  selectedId,
  onSelect,
  className,
  zoom = 14,
  onMapClick,
  pinPosition,
}: CivicMapProps) {
  const { isLoaded, hasKey } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)

  if (!hasKey || !isLoaded) {
    return (
      <MapMock
        issues={issuesToMapPoints(issues)}
        hotspots={hotspots}
        selectedId={selectedId}
        onSelect={onSelect}
        className={className}
      />
    )
  }

  return (
    <GoogleMap
      mapContainerClassName={className || 'size-full'}
      center={center}
      zoom={zoom}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
      options={{
        styles: mapStyle,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: onMapClick ? 'greedy' : 'auto',
      }}
    >
      {map && (
        <>
          <PanToCenter map={map} center={center} />
          <ClusteredMarkers map={map} issues={issues} selectedId={selectedId} onSelect={onSelect} />
          {hotspots.length > 0 && <HotspotMarkers map={map} hotspots={hotspots} />}
          {pinPosition && <DraftPin map={map} position={pinPosition} />}
          <MapClickHandler map={map} onMapClick={onMapClick} />
        </>
      )}
    </GoogleMap>
  )
}
