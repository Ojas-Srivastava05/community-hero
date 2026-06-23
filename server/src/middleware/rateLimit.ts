import type { Request, Response, NextFunction } from 'express'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function check(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

export function rateLimit(limit: number, windowMs: number, keyFn: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req)
    if (!check(key, limit, windowMs)) {
      res.status(429).json({ error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMIT' })
      return
    }
    next()
  }
}

export const reportLimit = rateLimit(10, 24 * 60 * 60 * 1000, (req) => `report:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const upvoteLimit = rateLimit(30, 60 * 60 * 1000, (req) => `upvote:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const chatLimit = rateLimit(20, 60 * 1000, (req) => `chat:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
