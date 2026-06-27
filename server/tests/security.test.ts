import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { Request, Response } from 'express'
import { ErrorCodes } from '../src/lib/errors'
import { validateImageBuffer, isLikelyBlankImage } from '../src/lib/media'
import { requireAdminSecret } from '../src/middleware/admin-secret'
import { reportLimit } from '../src/middleware/rateLimit'

describe('Appendix W — media validation', () => {
  it('rejects tiny buffers', () => {
    const result = validateImageBuffer(Buffer.alloc(100), 'image/jpeg')
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.reason, /small|blank/i)
  })

  it('rejects unsupported mime types', () => {
    const buf = Buffer.alloc(2048, 128)
    const result = validateImageBuffer(buf, 'application/pdf')
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.reason, /unsupported/i)
  })

  it('accepts valid jpeg buffer', () => {
    const buf = Buffer.alloc(2048)
    for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256
    const result = validateImageBuffer(buf, 'image/jpeg')
    assert.equal(result.ok, true)
  })

  it('detects likely blank uniform images', () => {
    const blank = Buffer.alloc(2048, 42)
    assert.equal(isLikelyBlankImage(blank), true)
  })
})

describe('Appendix W — error codes', () => {
  it('includes all canonical codes', () => {
    const expected = [
      'INVALID_MEDIA',
      'GPS_REQUIRED',
      'RATE_LIMITED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'NEEDS_REVIEW',
      'DUPLICATE_SUGGESTED',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
    ]
    for (const code of expected) {
      assert.ok(code in ErrorCodes, `missing ${code}`)
    }
  })
})

describe('requireAdminSecret — production hardening', () => {
  const prev = { ...process.env }

  beforeEach(() => {
    delete process.env.ADMIN_SECRET
    delete process.env.ADMIN_API_SECRET
  })

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.ADMIN_SECRET = prev.ADMIN_SECRET
    process.env.ADMIN_API_SECRET = prev.ADMIN_API_SECRET
  })

  function mockRes() {
    let statusCode = 0
    let body: unknown
    const res = {
      status(n: number) {
        statusCode = n
        return {
          json(b: unknown) {
            body = b
          },
        }
      },
    } as unknown as Response
    return { res, get: () => ({ statusCode, body }) }
  }

  it('blocks in production when secret unset', () => {
    process.env.NODE_ENV = 'production'
    const req = { headers: {} } as Request
    const { res, get } = mockRes()
    assert.equal(requireAdminSecret(req, res), false)
    const out = get()
    assert.equal(out.statusCode, 403)
    assert.deepEqual(out.body, { error: 'Admin secret not configured', code: 'FORBIDDEN' })
  })

  it('allows in development when secret unset', () => {
    process.env.NODE_ENV = 'development'
    const req = { headers: {} } as Request
    const { res } = mockRes()
    assert.equal(requireAdminSecret(req, res), true)
  })

  it('rejects wrong secret with FORBIDDEN code', () => {
    process.env.ADMIN_SECRET = 'test-secret'
    const req = { headers: { 'x-admin-secret': 'wrong' } } as unknown as Request
    const { res, get } = mockRes()
    assert.equal(requireAdminSecret(req, res), false)
    const out = get()
    assert.equal(out.statusCode, 403)
    assert.deepEqual(out.body, { error: 'Forbidden', code: 'FORBIDDEN' })
  })
})

describe('rate limits — 429 + Retry-After', () => {
  const prev = process.env.RATE_LIMIT_ENABLED

  afterEach(() => {
    process.env.RATE_LIMIT_ENABLED = prev
  })

  function runLimit(uid: string) {
    const req = { ip: '127.0.0.1', user: { uid } } as unknown as Request
    let statusCode = 0
    let headers: Record<string, string> = {}
    let body: unknown
    const res = {
      status(n: number) {
        statusCode = n
        return {
          json(b: unknown) {
            body = b
          },
        }
      },
      setHeader(k: string, v: string) {
        headers[k] = v
      },
    } as unknown as Response
    return new Promise<{ statusCode: number; headers: Record<string, string>; body: unknown }>((resolve) => {
      reportLimit(req, res, () => resolve({ statusCode: 200, headers, body: null }))
      if (statusCode) resolve({ statusCode, headers, body })
    })
  }

  it('returns 429 with RATE_LIMITED after limit exceeded', async () => {
    process.env.RATE_LIMIT_ENABLED = 'true'
    const uid = `rate-test-${Date.now()}`
    for (let i = 0; i < 10; i++) {
      const r = await runLimit(uid)
      assert.equal(r.statusCode, 200, `attempt ${i + 1} should pass`)
    }
    const blocked = await runLimit(uid)
    assert.equal(blocked.statusCode, 429)
    assert.deepEqual(blocked.body, {
      error: 'Rate limit exceeded. Try again later.',
      code: 'RATE_LIMITED',
    })
    assert.ok(blocked.headers['Retry-After'])
    assert.ok('X-RateLimit-Remaining' in blocked.headers)
  })

  it('skips limits when RATE_LIMIT_ENABLED=false', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false'
    const uid = `rate-off-${Date.now()}`
    for (let i = 0; i < 12; i++) {
      const r = await runLimit(uid)
      assert.equal(r.statusCode, 200)
    }
  })
})
