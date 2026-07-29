import ngeohash from 'ngeohash'
import {
  getFirestoreGeocode,
  getL1Geocode,
  setFirestoreGeocode,
  setL1Geocode,
  type GeocodeResult,
} from './geocode-cache'

export type { GeocodeResult }

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function deriveWardId(address: string | undefined, lat: number, lng: number): string {
  if (address) {
    const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) return parts[0]!
    if (parts.length === 1) return parts[0]!
  }
  return `area-${ngeohash.encode(lat, lng, 5)}`
}

async function fetchGeocodeFromGoogle(lat: number, lng: number): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
    const res = await fetch(url)
    const data = (await res.json()) as {
      results?: { formatted_address: string; address_components: { long_name: string; types: string[] }[] }[]
    }
    const result = data.results?.[0]
    if (!result) return null

    const pick = (type: string) =>
      result.address_components.find((c) => c.types.includes(type))?.long_name || ''
    const locality = pick('sublocality') || pick('neighborhood') || pick('locality')
    const city = pick('locality') || pick('administrative_area_level_2')

    return {
      address: result.formatted_address,
      locality: locality || city || 'Your area',
      city: city || 'Your city',
      wardId: locality || city || deriveWardId(result.formatted_address, lat, lng),
    }
  } catch {
    return null
  }
}

export type PlaceSearchResult = {
  lat: number
  lng: number
  address: string
  locality: string
  city: string
}

function pickAddressComponent(components: { long_name: string; types: string[] }[], type: string) {
  return components.find((c) => c.types.includes(type))?.long_name || ''
}

function mapGoogleGeocodeResults(
  results: {
    formatted_address: string
    geometry: { location: { lat: number; lng: number } }
    address_components: { long_name: string; types: string[] }[]
  }[],
): PlaceSearchResult[] {
  return results.map((r) => {
    const c = r.address_components
    const locality =
      pickAddressComponent(c, 'sublocality') ||
      pickAddressComponent(c, 'neighborhood') ||
      pickAddressComponent(c, 'locality')
    const city = pickAddressComponent(c, 'locality') || pickAddressComponent(c, 'administrative_area_level_2')
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      address: r.formatted_address,
      locality: locality || city || 'Your area',
      city: city || locality || 'Your city',
    }
  })
}

async function geocodeGoogleQuery(query: string): Promise<PlaceSearchResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({ address: query, key, region: 'in' })
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`)
    const data = (await res.json()) as {
      results?: {
        formatted_address: string
        geometry: { location: { lat: number; lng: number } }
        address_components: { long_name: string; types: string[] }[]
      }[]
    }
    return mapGoogleGeocodeResults(data.results || [])
  } catch {
    return []
  }
}

/** Landmark / POI text search — no GPS bounding box. */
async function findPlaceFromTextGoogle(query: string): Promise<PlaceSearchResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      input: query,
      inputtype: 'textquery',
      fields: 'formatted_address,name,geometry',
      key,
      region: 'in',
    })
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params}`)
    const data = (await res.json()) as {
      candidates?: {
        formatted_address?: string
        name?: string
        geometry?: { location: { lat: number; lng: number } }
      }[]
    }
    return (data.candidates || [])
      .filter((c) => c.geometry?.location)
      .map((c) => ({
        lat: c.geometry!.location.lat,
        lng: c.geometry!.location.lng,
        address: c.formatted_address || c.name || query,
        locality: c.name || 'Your area',
        city: 'India',
      }))
  } catch {
    return []
  }
}

async function placesAutocompleteGoogle(query: string): Promise<PlaceSearchResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      input: query,
      key,
      types: 'geocode|establishment',
      components: 'country:in',
    })
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`)
    const data = (await res.json()) as {
      predictions?: { description: string; place_id: string }[]
    }
    const predictions = (data.predictions || []).slice(0, 5)
    const results: PlaceSearchResult[] = []

    for (const p of predictions) {
      const detailParams = new URLSearchParams({
        place_id: p.place_id,
        fields: 'formatted_address,geometry,name',
        key,
      })
      const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailParams}`)
      const detail = (await detailRes.json()) as {
        result?: {
          formatted_address?: string
          name?: string
          geometry?: { location: { lat: number; lng: number } }
        }
      }
      const r = detail.result
      if (!r?.geometry?.location) continue
      results.push({
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        address: r.formatted_address || p.description,
        locality: r.name || 'Your area',
        city: 'India',
      })
    }
    return results
  } catch {
    return []
  }
}

async function forwardGeocodeGoogle(query: string): Promise<PlaceSearchResult[]> {
  const direct = await geocodeGoogleQuery(query)
  if (direct.length > 0) return direct

  if (!/\bindia\b/i.test(query)) {
    return geocodeGoogleQuery(`${query}, India`)
  }
  return []
}

async function forwardGeocodeNominatim(query: string): Promise<PlaceSearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query.includes('India') ? query : `${query}, India`,
      format: 'json',
      addressdetails: '1',
      limit: '8',
    })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'CommunityHero/1.0' },
    })
    const data = (await res.json()) as {
      lat: string
      lon: string
      display_name: string
      address?: Record<string, string>
    }[]
    return (data || []).map((r) => {
      const addr = r.address || {}
      const locality = addr.suburb || addr.neighbourhood || addr.village || ''
      const city = addr.city || addr.town || addr.state_district || ''
      return {
        lat: Number(r.lat),
        lng: Number(r.lon),
        address: r.display_name,
        locality: locality || city || 'Your area',
        city: city || locality || 'Your city',
      }
    })
  } catch {
    return []
  }
}

function placeKey(p: PlaceSearchResult): string {
  return `${p.address.toLowerCase()}|${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`
}

function mergePlaceResults(...lists: PlaceSearchResult[][]): PlaceSearchResult[] {
  const seen = new Set<string>()
  const merged: PlaceSearchResult[] = []
  for (const list of lists) {
    for (const item of list) {
      const key = placeKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }
  return merged
}

function sortByBiasDistance(results: PlaceSearchResult[], bias: { lat: number; lng: number }): PlaceSearchResult[] {
  return [...results].sort(
    (a, b) =>
      haversineKm(bias.lat, bias.lng, a.lat, a.lng) - haversineKm(bias.lat, bias.lng, b.lat, b.lng),
  )
}

/** Forward geocode for report wizard — global search; bias only sorts, never hard-filters. */
export async function searchPlacesServer(
  query: string,
  biasLat?: number,
  biasLng?: number,
): Promise<PlaceSearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const bias =
    biasLat !== undefined && biasLng !== undefined && Number.isFinite(biasLat) && Number.isFinite(biasLng)
      ? { lat: biasLat, lng: biasLng }
      : undefined

  const [autocomplete, findPlace, geocode, nominatim] = await Promise.all([
    placesAutocompleteGoogle(q),
    findPlaceFromTextGoogle(q),
    forwardGeocodeGoogle(q),
    forwardGeocodeNominatim(q),
  ])

  const merged = mergePlaceResults(autocomplete, findPlace, geocode, nominatim)

  const sorted = bias ? sortByBiasDistance(merged, bias) : merged
  return sorted.slice(0, 8)
}

export async function reverseGeocodeServer(lat: number, lng: number): Promise<GeocodeResult> {
  const l1 = getL1Geocode(lat, lng)
  if (l1) return l1

  const firestore = await getFirestoreGeocode(lat, lng)
  if (firestore) {
    setL1Geocode(lat, lng, firestore)
    return firestore
  }

  const fromGoogle = await fetchGeocodeFromGoogle(lat, lng)
  if (fromGoogle) {
    setL1Geocode(lat, lng, fromGoogle)
    void setFirestoreGeocode(lat, lng, fromGoogle)
    return fromGoogle
  }

  const fallback: GeocodeResult = {
    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    locality: 'Your area',
    city: 'Your city',
    wardId: deriveWardId(undefined, lat, lng),
  }
  setL1Geocode(lat, lng, fallback)
  void setFirestoreGeocode(lat, lng, fallback)
  return fallback
}
