import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ErrorCodes } from './errors'

describe('errors Appendix W codes', () => {
  it('includes SERVICE_UNAVAILABLE for 503 responses', () => {
    assert.equal(ErrorCodes.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE')
  })

  it('includes RATE_LIMITED for 429 responses', () => {
    assert.equal(ErrorCodes.RATE_LIMITED, 'RATE_LIMITED')
  })

  it('includes INVALID_MEDIA for blank uploads', () => {
    assert.equal(ErrorCodes.INVALID_MEDIA, 'INVALID_MEDIA')
  })
})
