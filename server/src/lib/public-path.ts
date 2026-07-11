import path from 'path'

/** Resolve `server/public/` — works in dev (tsx) and Cloud Run Docker. */
export function resolvePublicPath(...segments: string[]): string {
  return path.resolve(__dirname, '../../public', ...segments)
}

export const publicDir = resolvePublicPath()
