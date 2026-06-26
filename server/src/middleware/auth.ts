import type { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../lib/firebase-admin'
import { sendError, ErrorCodes } from '../lib/errors'

export type AuthedUser = { uid: string; email?: string; admin?: boolean }

export type AuthedRequest = Request & { user?: AuthedUser }

export function isAdminUser(user: AuthedUser): boolean {
  const admins = (process.env.ADMIN_UIDS || '').split(',').filter(Boolean)
  const adminEmails = (process.env.ADMIN_EMAILS || 'srivastavaojas454@gmail.com')
    .split(',')
    .filter(Boolean)
  return (
    user.admin === true ||
    admins.includes(user.uid) ||
    Boolean(user.email && adminEmails.includes(user.email))
  )
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    sendError(res, 401, ErrorCodes.UNAUTHORIZED, 'Unauthorized')
    return
  }
  try {
    const token = header.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      admin: decoded.admin === true,
    }
    next()
  } catch {
    sendError(res, 401, ErrorCodes.UNAUTHORIZED, 'Invalid token')
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    sendError(res, 401, ErrorCodes.UNAUTHORIZED, 'Unauthorized')
    return
  }
  if (isAdminUser(req.user)) {
    next()
    return
  }
  sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
}
