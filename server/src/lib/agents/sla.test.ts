import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeSlaBreached } from './sla'
import { getSlaHours } from './routing'

describe('computeSlaBreached', () => {
  it('returns false when deadline is in the future', () => {
    const future = new Date(Date.now() + 48 * 3600000).toISOString()
    assert.equal(computeSlaBreached(future, 'Submitted'), false)
  })

  it('returns true when deadline passed and status is open', () => {
    const past = new Date(Date.now() - 3600000).toISOString()
    assert.equal(computeSlaBreached(past, 'In Progress'), true)
  })

  it('returns false for Resolved/Closed even if deadline passed', () => {
    const past = new Date(Date.now() - 3600000).toISOString()
    assert.equal(computeSlaBreached(past, 'Resolved'), false)
    assert.equal(computeSlaBreached(past, 'Closed'), false)
  })

  it('returns false when slaDeadline is missing', () => {
    assert.equal(computeSlaBreached(undefined, 'Submitted'), false)
  })
})

describe('getSlaHours (Appendix L matrix)', () => {
  it('uses category-specific hours by severity', () => {
    assert.equal(getSlaHours('waste', 5), 12)
    assert.equal(getSlaHours('pothole', 5), 48)
    assert.equal(getSlaHours('water_leak', 1), 120)
  })

  it('clamps severity to 1-5', () => {
    assert.equal(getSlaHours('waste', 0), getSlaHours('waste', 1))
    assert.equal(getSlaHours('waste', 99), getSlaHours('waste', 5))
  })

  it('falls back to other category for unknown categories', () => {
    assert.equal(getSlaHours('other', 3), 96)
  })
})
