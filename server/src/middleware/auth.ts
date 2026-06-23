import type { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../lib/firebase-admin'

export type AuthedRequest = Request & { user?: { uid: string; email?: string } }

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const token = header.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const admins = (process.env.ADMIN_UIDS || '').split(',').filter(Boolean)
  const adminEmails = (process.env.ADMIN_EMAILS || 'srivastavaojas454@gmail.com').split(',')
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  if (admins.includes(req.user.uid) || (req.user.email && adminEmails.includes(req.user.email))) {
    next()
    return
  }
  res.status(403).json({ error: 'Forbidden' })
}
