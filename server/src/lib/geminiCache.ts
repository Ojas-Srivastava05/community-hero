import crypto from 'crypto'
import type { IssueAnalysis } from '../types/shared'

const TTL_MS = 60 * 60 * 1000
const MAX_ENTRIES = 200

interface CacheEntry {
  analysis: IssueAnalysis
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

export function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function getCachedAnalysis(hash: string): IssueAnalysis | null {
  const entry = cache.get(hash)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(hash)
    return null
  }
  return entry.analysis
}

export function setCachedAnalysis(hash: string, analysis: IssueAnalysis): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(hash, { analysis, expiresAt: Date.now() + TTL_MS })
}
