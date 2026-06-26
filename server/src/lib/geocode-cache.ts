import { AsyncLocalStorage } from 'async_hooks'
import ngeohash from 'ngeohash'
import { db } from './firebase-admin'
import { deriveWardId } from './geo'

export type GeocodeResult = {
  address: string
  locality: string
  city: string
  wardId: string
}

const L1_TTL_MS = 60 * 1000
const FIRESTORE_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
  value: GeocodeResult
  expiresAt: number
}

/** L1 — per-request context cache (AsyncLocalStorage) */
const requestStore = new AsyncLocalStorage<Map<string, CacheEntry>>()

/** L1 — process-wide hot cache between requests */
const hotCache = new Map<string, CacheEntry>()

function cacheKey(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, 7)
}

function getFromMap(map: Map<string, CacheEntry>, key: string): GeocodeResult | null {
  const entry = map.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    map.delete(key)
    return null
  }
  return entry.value
}

function setInMap(map: Map<string, CacheEntry>, key: string, value: GeocodeResult, ttlMs: number): void {
  if (map.size >= 500) {
    const oldest = map.keys().next().value
    if (oldest) map.delete(oldest)
  }
  map.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function runWithGeocodeCache<T>(fn: () => T): T {
  return requestStore.run(new Map(), fn)
}

export function getL1Geocode(lat: number, lng: number): GeocodeResult | null {
  const key = cacheKey(lat, lng)
  const reqMap = requestStore.getStore()
  if (reqMap) {
    const hit = getFromMap(reqMap, key)
    if (hit) return hit
  }
  return getFromMap(hotCache, key)
}

export function setL1Geocode(lat: number, lng: number, value: GeocodeResult): void {
  const key = cacheKey(lat, lng)
  const reqMap = requestStore.getStore()
  if (reqMap) setInMap(reqMap, key, value, L1_TTL_MS)
  setInMap(hotCache, key, value, L1_TTL_MS)
}

export async function getFirestoreGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const geohash = ngeohash.encode(lat, lng, 5)
  try {
    const doc = await db.collection('geocode_cache').doc(geohash).get()
    if (!doc.exists) return null
    const data = doc.data()!
    const expiresAt = data.expiresAt as string | undefined
    if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
      await doc.ref.delete().catch(() => {})
      return null
    }
    return {
      address: String(data.address || ''),
      locality: String(data.locality || 'Your area'),
      city: String(data.city || 'Your city'),
      wardId: String(data.wardId || deriveWardId(data.address as string | undefined, lat, lng)),
    }
  } catch {
    return null
  }
}

export async function setFirestoreGeocode(lat: number, lng: number, value: GeocodeResult): Promise<void> {
  const geohash = ngeohash.encode(lat, lng, 5)
  const expiresAt = new Date(Date.now() + FIRESTORE_TTL_MS).toISOString()
  try {
    await db.collection('geocode_cache').doc(geohash).set({
      geohash,
      lat,
      lng,
      address: value.address,
      locality: value.locality,
      city: value.city,
      wardId: value.wardId,
      expiresAt,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    /* non-blocking */
  }
}
