import { useEffect, useRef, useState } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { MarkerClusterer, defaultOnClusterClickHandler } from '@googlemaps/markerclusterer'
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
  /** Purple density rings — off by default on explorer; easy to confuse with issue pins. */
  showHotspotLayer?: boolean
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
  zoom?: number
  /** Click map to set a draft pin (ReportWizard confirm step). */
  onMapClick?: (lat: number, lng: number) => void
  /** Highlight user-adjusted pin separate from issue markers. */
  pinPosition?: { lat: number; lng: number }
  /** Shown on fallback map when Google Maps JS is unavailable. */
  mapLabel?: string
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

function issueMarkerZIndex(issue: Issue, selectedId?: string): number {
  if (selectedId === issue.id) return 2000
  return 1200 + issue.severity * 10
}

function pinDropIcon(): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M16 2C10.5 2 6 6.5 6 12c0 7 10 18 10 18s10-11 10-18c0-5.5-4.5-10-10-10z" fill="#e8754a" stroke="#fff" stroke-width="2"/><circle cx="16" cy="12" r="4" fill="#fff"/></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 32),
  }
}

function hotspotMarkerIcon(predictive: boolean, count: number): google.maps.Icon {
  const color = predictive ? '#c0392b' : '#6c5ce7'
  const label = count > 99 ? '99+' : String(count)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/>
    <circle cx="18" cy="18" r="12" fill="${color}"/>
    <text x="18" y="18" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${label}</text>
  </svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 18),
  }
}

/** Decorative only — must not steal clicks from issue markers. */
function HotspotMarkers({ map, hotspots }: { map: google.maps.Map; hotspots: MapHotspot[] }) {
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = hotspots.map((h) => {
      return new google.maps.Marker({
        map,
        position: { lat: h.lat, lng: h.lng },
        icon: hotspotMarkerIcon(Boolean(h.predictive), h.count),
        zIndex: 200,
        clickable: false,
        title: `${h.geohash}: ${h.count} open (score ${h.score})`,
      })
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
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const markerIssueIdRef = useRef(new WeakMap<google.maps.Marker, string>())
  const issueByIdRef = useRef(new Map<string, Issue>())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const issueKey = issues.map((i) => `${i.id}:${i.lat}:${i.lng}:${i.severity}`).join('|')

  const selectIssue = (issueId: string) => {
    const issue = issueByIdRef.current.get(issueId)
    if (!issue) return
    onSelectRef.current?.(issueId)
    map.panTo({ lat: issue.lat, lng: issue.lng })
    const zoom = map.getZoom() ?? 14
    if (zoom < 16) map.setZoom(16)
  }

  useEffect(() => {
    issueByIdRef.current = new Map(issues.map((i) => [i.id, i]))
    clustererRef.current?.clearMarkers()
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    markerByIdRef.current.clear()

    const markers = issues.map((issue) => {
      const marker = new google.maps.Marker({
        position: { lat: issue.lat, lng: issue.lng },
        icon: severityMarkerIcon(issue.severity, false),
        title: issue.title,
        zIndex: issueMarkerZIndex(issue, selectedId),
        optimized: false,
        clickable: true,
      })
      markerIssueIdRef.current.set(marker, issue.id)
      marker.addListener('click', () => selectIssue(issue.id))
      markerByIdRef.current.set(issue.id, marker)
      return marker
    })

    markersRef.current = markers
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      onClusterClick: (_event, cluster, m) => {
        const clusterMarkers = cluster.markers as google.maps.Marker[] | undefined
        const first = clusterMarkers?.[0]
        const issueId = first ? markerIssueIdRef.current.get(first) : undefined
        if (issueId) selectIssue(issueId)
        defaultOnClusterClickHandler(_event, cluster, m)
      },
    })

    return () => {
      clustererRef.current?.clearMarkers()
      markersRef.current.forEach((m) => google.maps.event.clearInstanceListeners(m))
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      markerByIdRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- issueKey captures issue data changes
  }, [map, issueKey])

  useEffect(() => {
    for (const issue of issues) {
      const marker = markerByIdRef.current.get(issue.id)
      if (!marker) continue
      marker.setIcon(severityMarkerIcon(issue.severity, Boolean(selectedId && selectedId !== issue.id)))
      marker.setZIndex(issueMarkerZIndex(issue, selectedId))
    }
  }, [issues, selectedId])

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
      zIndex: 2100,
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
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick

  useEffect(() => {
    if (!onMapClickRef.current) return
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat()
      const lng = e.latLng?.lng()
      if (lat !== undefined && lng !== undefined) onMapClickRef.current?.(lat, lng)
    })
    return () => google.maps.event.removeListener(listener)
  }, [map])

  return null
}

function PanToCenter({ map, center }: { map: google.maps.Map; center: { lat: number; lng: number } }) {
  const lastRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const prev = lastRef.current
    if (prev && prev.lat === center.lat && prev.lng === center.lng) return
    lastRef.current = center
    map.panTo(center)
  }, [map, center.lat, center.lng])

  return null
}

export function CivicMap({
  center,
  issues,
  hotspots = [],
  showHotspotLayer = false,
  selectedId,
  onSelect,
  className,
  zoom = 14,
  onMapClick,
  pinPosition,
  mapLabel,
}: CivicMapProps) {
  const { isLoaded, hasKey, loadError } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const useFallback = !hasKey || !isLoaded || Boolean(loadError)

  if (useFallback) {
    return (
      <MapMock
        issues={issuesToMapPoints(issues)}
        hotspots={showHotspotLayer ? hotspots : []}
        selectedId={selectedId}
        onSelect={onSelect}
        className={className}
        center={center}
        pinPosition={pinPosition}
        onMapClick={onMapClick}
        mapLabel={mapLabel}
        interactiveLabel={
          onMapClick
            ? loadError
              ? 'Map preview — tap to set pin (search box still works)'
              : 'Tap map to drop pin'
            : undefined
        }
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
        gestureHandling: onMapClick ? 'greedy' : 'greedy',
        clickableIcons: false,
      }}
    >
      {map && (
        <>
          <PanToCenter map={map} center={center} />
          <ClusteredMarkers map={map} issues={issues} selectedId={selectedId} onSelect={onSelect} />
          {showHotspotLayer && hotspots.length > 0 && <HotspotMarkers map={map} hotspots={hotspots} />}
          {pinPosition && <DraftPin map={map} position={pinPosition} />}
          <MapClickHandler map={map} onMapClick={onMapClick} />
        </>
      )}
    </GoogleMap>
  )
}
