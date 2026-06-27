import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { averageCoords } from './threads-geo'

describe('averageCoords', () => {
  it('returns null for empty input', () => {
    assert.equal(averageCoords([]), null)
  })

  it('averages lat/lng across coordinates', () => {
    const centroid = averageCoords([
      { lat: 10, lng: 20 },
      { lat: 20, lng: 40 },
    ])
    assert.deepEqual(centroid, { lat: 15, lng: 30 })
  })
})
