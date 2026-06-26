import type { Response } from 'express'

export const ErrorCodes = {
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_MEDIA: 'INVALID_MEDIA',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  DUPLICATE_SUGGESTED: 'DUPLICATE_SUGGESTED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
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
