import fs from 'fs'
import path from 'path'

/** Resolve repo `public/` — works in dev (tsx) and Cloud Run Docker (`/app/public`). */
export function resolvePublicPath(...segments: string[]): string {
  const candidates = [
    path.resolve(__dirname, '../../public', ...segments),
    path.resolve(__dirname, '../../../public', ...segments),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

export const publicDir = resolvePublicPath()
