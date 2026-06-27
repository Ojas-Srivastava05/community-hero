import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateImageBuffer, isLikelyBlankImage } from './media-validation'

describe('media-validation', () => {
  it('rejects tiny buffers', () => {
    const result = validateImageBuffer(Buffer.alloc(100), 'image/jpeg')
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.reason, /small|blank/i)
  })

  it('rejects unsupported MIME types', () => {
    const buf = Buffer.alloc(2048, 128)
    const result = validateImageBuffer(buf, 'application/pdf')
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.reason, /unsupported/i)
  })

  it('accepts valid JPEG with variance', () => {
    const buf = Buffer.alloc(2048)
    for (let i = 0; i < buf.length; i++) buf[i] = (i * 17 + 42) % 256
    const result = validateImageBuffer(buf, 'image/jpeg')
    assert.equal(result.ok, true)
  })

  it('detects uniform blank frames', () => {
    const buf = Buffer.alloc(2048, 200)
    assert.equal(isLikelyBlankImage(buf), true)
  })
})
