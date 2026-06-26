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
