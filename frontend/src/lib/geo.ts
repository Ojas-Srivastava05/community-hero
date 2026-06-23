export type GeoPlace = {
  lat: number
  lng: number
  address: string
  locality: string
  city: string
  region: string
  country: string
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Could not get your location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

function pickComponent(components: { long_name: string; types: string[] }[], type: string) {
  return components.find((c) => c.types.includes(type))?.long_name || ''
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace> {
  if (MAPS_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}`
      const res = await fetch(url)
      const data = (await res.json()) as {
        results?: { formatted_address: string; address_components: { long_name: string; types: string[] }[] }[]
      }
      const result = data.results?.[0]
      if (result) {
        const c = result.address_components
        const locality = pickComponent(c, 'sublocality') || pickComponent(c, 'neighborhood') || pickComponent(c, 'locality')
        const city = pickComponent(c, 'locality') || pickComponent(c, 'administrative_area_level_2')
        const region = pickComponent(c, 'administrative_area_level_1')
        const country = pickComponent(c, 'country')
        return {
          lat,
          lng,
          address: result.formatted_address,
          locality: locality || city || 'Your area',
          city: city || region || 'Your city',
          region,
          country,
        }
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = (await res.json()) as { display_name?: string; address?: Record<string, string> }
    const addr = data.address || {}
    const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || ''
    const city = addr.city || addr.town || addr.county || ''
    return {
      lat,
      lng,
      address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      locality: locality || city || 'Your area',
      city: city || locality || 'Your city',
      region: addr.state || '',
      country: addr.country || '',
    }
  } catch {
    return {
      lat,
      lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      locality: 'Your area',
      city: 'Your city',
      region: '',
      country: '',
    }
  }
}

export function sortByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  lat: number,
  lng: number,
  radiusKm?: number,
): T[] {
  const withDist = items
    .map((item) => ({ item, dist: haversineKm(lat, lng, item.lat, item.lng) }))
    .filter((x) => (radiusKm ? x.dist <= radiusKm : true))
    .sort((a, b) => a.dist - b.dist)
  return withDist.map((x) => x.item)
}

export function locationLabel(place: Pick<GeoPlace, 'locality' | 'city'>): string {
  if (place.locality && place.city && place.locality !== place.city) {
    return `${place.locality} · ${place.city}`
  }
  return place.locality || place.city || 'Near you'
}
