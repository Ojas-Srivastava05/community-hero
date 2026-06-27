import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toOpen311Record } from './open311'

describe('toOpen311Record', () => {
  const base = {
    category: 'pothole',
    status: 'Submitted',
    description: 'Large pothole on main road',
    lat: 12.9352,
    lng: 77.6245,
    address: 'Koramangala, Bengaluru',
    createdAt: '2026-06-26T10:00:00.000Z',
    updatedAt: '2026-06-26T11:30:00.000Z',
    imageUrls: ['https://storage.googleapis.com/example/photo.jpg'],
    departmentId: 'Roads & Infrastructure',
  }

  it('maps GeoReport v2 field names and service codes', () => {
    const record = toOpen311Record('issue-abc', base)
    assert.equal(record.service_request_id, 'issue-abc')
    assert.equal(record.service_code, '001')
    assert.equal(record.service_name, 'pothole')
    assert.equal(record.service_request_status, 'open')
    assert.equal(record.long, 77.6245)
    assert.equal(record.lat, 12.9352)
    assert.equal(record.address_string, 'Koramangala, Bengaluru')
    assert.equal(record.media_url, 'https://storage.googleapis.com/example/photo.jpg')
    assert.equal(record.agency_responsible, 'Roads & Infrastructure')
  })

  it('maps resolved statuses to closed', () => {
    const record = toOpen311Record('issue-xyz', { ...base, status: 'Resolved' })
    assert.equal(record.service_request_status, 'closed')
  })

  it('falls back to other service code for unknown categories', () => {
    const record = toOpen311Record('issue-other', { ...base, category: 'unknown_cat' })
    assert.equal(record.service_code, '099')
  })
})
