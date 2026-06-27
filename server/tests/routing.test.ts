import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runRoutingAgent, getSlaHours } from '../src/lib/agents/routing'
import type { IssueAnalysis } from '../src/types/shared'

const baseAnalysis: IssueAnalysis = {
  category: 'pothole',
  severity: 4,
  title: 'Large pothole on Main Road',
  description: 'Deep pothole causing traffic hazard',
  department: 'Roads & Infrastructure',
  safety_risk: true,
  confidence: 0.92,
}

describe('runRoutingAgent', () => {
  const createdAt = new Date().toISOString()

  it('maps category to departmentId via DEPARTMENTS', () => {
    const result = runRoutingAgent(baseAnalysis, createdAt)
    assert.equal(result.departmentId, 'Roads & Infrastructure')
    assert.ok(result.slaHours > 0)
    assert.ok(result.slaDeadline > createdAt)
    assert.ok(result.priorityScore >= 0 && result.priorityScore <= 100)
  })

  it('uses analysis.department when provided', () => {
    const result = runRoutingAgent(
      { ...baseAnalysis, department: 'Custom Dept' },
      createdAt,
    )
    assert.equal(result.departmentId, 'Custom Dept')
  })

  it('getSlaHours tightens deadline for higher severity', () => {
    const low = getSlaHours('pothole', 1)
    const high = getSlaHours('pothole', 5)
    assert.ok(high < low)
  })

  it('boosts priorityScore when safety_risk is true', () => {
    const safe = runRoutingAgent({ ...baseAnalysis, safety_risk: false }, createdAt)
    const risky = runRoutingAgent({ ...baseAnalysis, safety_risk: true }, createdAt)
    assert.ok(risky.priorityScore > safe.priorityScore)
  })
})
