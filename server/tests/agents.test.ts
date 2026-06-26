import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { confidenceGateUpdates, REVIEW_CONFIDENCE_THRESHOLD } from '../src/lib/agents/types'

describe('Agent confidence gate', () => {
  it('low confidence sets Draft and needs_review', () => {
    const updates = confidenceGateUpdates(REVIEW_CONFIDENCE_THRESHOLD - 0.15)
    assert.equal(updates.status, 'Draft')
    assert.equal(updates['aiMetadata.needs_review'], true)
  })

  it('high confidence returns empty updates', () => {
    const updates = confidenceGateUpdates(0.85)
    assert.equal(updates.status, undefined)
    assert.equal(updates['aiMetadata.needs_review'], undefined)
  })

  it('at threshold does not trigger review', () => {
    const updates = confidenceGateUpdates(REVIEW_CONFIDENCE_THRESHOLD)
    assert.deepEqual(updates, {})
  })

  it('just below threshold triggers review branch', () => {
    const updates = confidenceGateUpdates(REVIEW_CONFIDENCE_THRESHOLD - 0.001)
    assert.equal(updates.status, 'Draft')
  })
})
