import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createReportSchema } from '../src/lib/report-schema'

describe('createReportSchema (POST /api/reports)', () => {
  const valid = {
    title: 'Pothole on 1st Cross',
    description: 'Deep pothole blocking traffic',
    category: 'pothole',
    severity: 4,
    lat: 12.9352,
    lng: 77.6245,
  }

  it('accepts valid report payload', () => {
    const parsed = createReportSchema.safeParse(valid)
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.category, 'pothole')
      assert.equal(parsed.data.severity, 4)
    }
  })

  it('coerces string severity and boolish safety_risk', () => {
    const parsed = createReportSchema.safeParse({ ...valid, severity: '3', safety_risk: 'true' })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.severity, 3)
      assert.equal(parsed.data.safety_risk, true)
    }
  })

  it('rejects short title and invalid category', () => {
    assert.equal(createReportSchema.safeParse({ ...valid, title: 'ab' }).success, false)
    assert.equal(createReportSchema.safeParse({ ...valid, category: 'invalid' }).success, false)
  })

  it('rejects severity outside 1-5', () => {
    assert.equal(createReportSchema.safeParse({ ...valid, severity: 0 }).success, false)
    assert.equal(createReportSchema.safeParse({ ...valid, severity: 6 }).success, false)
  })
})
