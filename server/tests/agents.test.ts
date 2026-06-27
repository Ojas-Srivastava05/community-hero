import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { confidenceGateUpdates, REVIEW_CONFIDENCE_THRESHOLD } from '../src/lib/agents/types'
import { computeVerificationFromUpvotes } from '../src/lib/agents/index'
import { isDuplicateMatch, SIMILARITY_THRESHOLD, MAX_DISTANCE_KM } from '../src/lib/embeddings'

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

describe('Community verification tiers (processUpvote)', () => {
  it('0 upvotes → level 0', () => {
    const { verificationLevel } = computeVerificationFromUpvotes(0)
    assert.equal(verificationLevel, 0)
  })

  it('1 upvote → Acknowledged (level 1)', () => {
    const { verificationLevel, status } = computeVerificationFromUpvotes(1, 'Submitted')
    assert.equal(verificationLevel, 1)
    assert.equal(status, 'Submitted')
  })

  it('3 upvotes → Community Verified (level 2) and status bump', () => {
    const { verificationLevel, status } = computeVerificationFromUpvotes(3, 'Submitted')
    assert.equal(verificationLevel, 2)
    assert.equal(status, 'Community Verified')
  })

  it('3 upvotes does not override In Progress status', () => {
    const { status } = computeVerificationFromUpvotes(3, 'In Progress')
    assert.equal(status, 'In Progress')
  })

  it('10 upvotes → Priority Escalation (level 3)', () => {
    const { verificationLevel } = computeVerificationFromUpvotes(10, 'Community Verified')
    assert.equal(verificationLevel, 3)
  })
})

describe('Dedup agent thresholds', () => {
  it('matches when similarity > 0.85 and within 50m', () => {
    assert.equal(isDuplicateMatch(SIMILARITY_THRESHOLD + 0.01, MAX_DISTANCE_KM), true)
    assert.equal(isDuplicateMatch(0.9, 0.04), true)
  })

  it('rejects when too far or low similarity', () => {
    assert.equal(isDuplicateMatch(0.9, MAX_DISTANCE_KM + 0.01), false)
    assert.equal(isDuplicateMatch(SIMILARITY_THRESHOLD, 0.01), false)
    assert.equal(isDuplicateMatch(0.5, 0.01), false)
  })
})
