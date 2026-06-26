import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computePriorityScore } from './priority'

describe('computePriorityScore', () => {
  const now = new Date().toISOString()

  it('weights severity, upvotes, safety risk, and age', () => {
    const score = computePriorityScore(5, 10, true, now)
    assert.ok(score >= 50)
  })

  it('adds safety boost when safety risk is true', () => {
    const withSafety = computePriorityScore(3, 0, true, now)
    const without = computePriorityScore(3, 0, false, now)
    assert.ok(withSafety > without)
  })

  it('returns bounded score 0-100', () => {
    const score = computePriorityScore(1, 0, false, now)
    assert.ok(score >= 0 && score <= 100)
  })
})
