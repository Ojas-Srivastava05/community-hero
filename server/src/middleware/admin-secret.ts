import type { Request, Response } from 'express'
import { sendError, ErrorCodes } from '../lib/errors'

/** Appendix W — admin batch endpoints require ADMIN_SECRET in production. */
export function requireAdminSecret(req: Request, res: Response): boolean {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_API_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'Admin secret not configured')
      return false
    }
    return true
  }
  const raw = req.headers['x-admin-secret'] ?? req.headers.authorization
  const header = Array.isArray(raw) ? raw[0] : raw?.toString().replace(/^Bearer\s+/i, '')
  if (header !== secret) {
    sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
    return false
  }
  return true
}
