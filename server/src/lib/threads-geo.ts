/** Pure centroid helper — used by threads route and unit tests */
export function averageCoords(coords: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (!coords.length) return null
  let lat = 0
  let lng = 0
  for (const c of coords) {
    lat += c.lat
    lng += c.lng
  }
  return { lat: lat / coords.length, lng: lng / coords.length }
}
