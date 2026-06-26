import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import ngeohash from 'ngeohash'
import { deriveWardId, haversineKm } from '../src/lib/geo'

describe('geohash encoding', () => {
  const lat = 12.9352
  const lng = 77.6245

  it('encodes Bangalore demo coordinates at precision 7', () => {
    const hash = ngeohash.encode(lat, lng, 7)
    assert.match(hash, /^[0-9b-hjkmnp-z]{7}$/)
    const decoded = ngeohash.decode(hash)
    assert.ok(Math.abs(decoded.latitude - lat) < 0.01)
    assert.ok(Math.abs(decoded.longitude - lng) < 0.01)
  })

  it('prefix-6 supports duplicate neighbor queries', () => {
    const a = ngeohash.encode(lat, lng, 6)
    const nearby = ngeohash.encode(lat + 0.001, lng + 0.001, 6)
    assert.equal(a.slice(0, 5), nearby.slice(0, 5))
  })

  it('deriveWardId uses address locality when present', () => {
    assert.equal(deriveWardId('Koramangala, Bengaluru', lat, lng), 'Koramangala')
  })

  it('deriveWardId falls back to geohash area prefix', () => {
    const ward = deriveWardId(undefined, lat, lng)
    assert.match(ward, /^area-[0-9b-hjkmnp-z]{5}$/)
  })

  it('haversineKm returns ~0 for same point', () => {
    assert.ok(haversineKm(lat, lng, lat, lng) < 0.001)
  })

  it('haversineKm returns plausible distance for offset', () => {
    const km = haversineKm(lat, lng, lat + 0.01, lng)
    assert.ok(km > 0.5 && km < 2)
  })
})
