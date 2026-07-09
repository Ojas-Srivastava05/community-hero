import type { Request, Response, NextFunction } from 'express'
import { sendError, ErrorCodes } from '../lib/errors'
import { db } from '../lib/firebase-admin'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function rateLimitsEnabled(): boolean {
  const flag = process.env.RATE_LIMIT_ENABLED
  if (flag === undefined || flag === '') return true
  return flag !== 'false' && flag !== '0'
}

function useFirestoreStore(): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_ENABLED === 'memory') return false
  return process.env.RATE_LIMIT_STORE === 'firestore' || process.env.NODE_ENV === 'production'
}

function checkMemory(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec?: number; remaining?: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    }
  }
  bucket.count += 1
  return { ok: true, remaining: Math.max(0, limit - bucket.count) }
}

async function checkFirestore(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec?: number; remaining?: number }> {
  const now = Date.now()
  const ref = db.collection('rate_limits').doc(key.replace(/\//g, '_'))
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() as { count?: number; resetAt?: number } | undefined
    if (!data || !data.resetAt || now > data.resetAt) {
      tx.set(ref, { count: 1, resetAt: now + windowMs, updatedAt: new Date().toISOString() })
      return { ok: true, remaining: limit - 1 }
    }
    if ((data.count ?? 0) >= limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((data.resetAt - now) / 1000)),
        remaining: 0,
      }
    }
    const next = (data.count ?? 0) + 1
    tx.update(ref, { count: next, updatedAt: new Date().toISOString() })
    return { ok: true, remaining: Math.max(0, limit - next) }
  })
}

export function rateLimit(limit: number, windowMs: number, keyFn: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!rateLimitsEnabled()) {
      next()
      return
    }
    const key = keyFn(req)
    try {
      const result = useFirestoreStore()
        ? await checkFirestore(key, limit, windowMs)
        : checkMemory(key, limit, windowMs)
      if (result.remaining !== undefined) {
        res.setHeader('X-RateLimit-Remaining', String(result.remaining))
      }
      if (!result.ok) {
        if (result.retryAfterSec) res.setHeader('Retry-After', String(result.retryAfterSec))
        sendError(res, 429, ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Try again later.')
        return
      }
      next()
    } catch {
      const fallback = checkMemory(key, limit, windowMs)
      if (!fallback.ok) {
        sendError(res, 429, ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Try again later.')
        return
      }
      next()
    }
  }
}

export const reportLimit = rateLimit(10, 24 * 60 * 60 * 1000, (req) => `report:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const upvoteLimit = rateLimit(30, 60 * 60 * 1000, (req) => `upvote:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
export const chatLimit = rateLimit(20, 60 * 1000, (req) => `chat:${(req as { user?: { uid: string } }).user?.uid || req.ip}`)
