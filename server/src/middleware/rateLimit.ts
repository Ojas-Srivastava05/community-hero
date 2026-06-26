import type { Request, Response, NextFunction } from 'express'
import { sendError, ErrorCodes } from '../lib/errors'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function check(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count += 1
  return { ok: true }
}

export function rateLimit(limit: number, windowMs: number, keyFn: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req)
    const result = check(key, limit, windowMs)
    if (!result.ok) {
      if (result.retryAfterSec) res.setHeader('Retry-After', String(result.retryAfterSec))
      sendError(res, 429, ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Try again later.')
      return
    }
    next()
  }
}

export const reportLimit = rateLimit(10, 24 * 60 * 60 * 1000, (req) => `report:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const upvoteLimit = rateLimit(30, 60 * 60 * 1000, (req) => `upvote:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const chatLimit = rateLimit(20, 60 * 1000, (req) => `chat:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
