#!/usr/bin/env tsx
/**
 * Delegates to canonical Appendix R seed (25 demo issues).
 * Prefer: make seed  OR  cd server && npx tsx scripts/seed-firestore.ts
 */
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
execSync('npx tsx scripts/seed-firestore.ts', {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
})
