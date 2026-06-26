import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computePriorityScore } from './priority'

describe('computePriorityScore', () => {
  it('weights severity, safety risk, and confidence', () => {
    // severity 3 → 3 * 0.4 * 20 = 24; no safety; confidence 0.9 → 9
    assert.equal(computePriorityScore(3, false, 0.9), 33)
  })

  it('adds 30 when safety risk is true', () => {
    // severity 5 → 40; safety +30; confidence 1 → 10
    assert.equal(computePriorityScore(5, true, 1), 80)
  })

  it('returns minimum score for low-severity, low-confidence reports', () => {
    assert.equal(computePriorityScore(1, false, 0), 8)
  })
})
