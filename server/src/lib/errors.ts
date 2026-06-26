import type { Response } from 'express'

/** Appendix W — canonical error codes */
export const ErrorCodes = {
  INVALID_MEDIA: 'INVALID_MEDIA',
  GPS_REQUIRED: 'GPS_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  DUPLICATE_SUGGESTED: 'DUPLICATE_SUGGESTED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

const CODE_STATUS: Record<ErrorCode, number> = {
  INVALID_MEDIA: 400,
  GPS_REQUIRED: 400,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NEEDS_REVIEW: 202,
  DUPLICATE_SUGGESTED: 200,
  SERVER_ERROR: 500,
}

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  extra?: Record<string, unknown>,
) {
  res.status(status).json({ error: message, code, ...extra })
}

export function sendServerError(res: Response, e: unknown): void {
  if (isApiError(e)) {
    const status = e.status ?? CODE_STATUS[e.code] ?? 500
    sendError(res, status, e.code, e.message)
    return
  }
  console.error(e)
  sendError(res, 500, ErrorCodes.SERVER_ERROR, 'Internal server error')
}
