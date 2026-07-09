/**
 * Production regression: waste reports with "food" in description must not be intake-blocked.
 * Run: cd server && npx tsx ../scripts/test-production-submit.ts
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { adminAuth } from '../server/src/lib/firebase-admin'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnvFile(resolve(ROOT, 'frontend/.env'))
loadEnvFile(resolve(ROOT, 'server/.env'))

const BASE = process.env.PRODUCTION_URL ?? 'https://community-hero-987477089222.asia-south1.run.app'
const apiKey =
  process.env.VITE_FIREBASE_API_KEY ?? process.env.FIREBASE_WEB_API_KEY ?? ''

async function main() {
  if (!apiKey) {
    console.error('Set VITE_FIREBASE_API_KEY in frontend/.env')
    process.exit(1)
  }

  const custom = await adminAuth.createCustomToken('demo-citizen-v2ship')
  const ex = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: custom, returnSecureToken: true }),
    },
  )
  const exBody = (await ex.json()) as { idToken?: string; error?: { message?: string } }
  if (!exBody.idToken) {
    console.error('Token exchange failed:', exBody.error?.message ?? exBody)
    process.exit(1)
  }

  const jpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    'base64',
  )

  const form = new FormData()
  form.append('title', 'Garbage pile with food waste')
  form.append('description', 'Large accumulation of food waste and plastic containers near the road')
  form.append('category', 'waste')
  form.append('severity', '4')
  form.append('lat', '25.4906')
  form.append('lng', '81.8768')
  form.append('address', 'Govindpur, Prayagraj')
  form.append('images', new Blob([jpeg], { type: 'image/jpeg' }), 'test.jpg')

  const res = await fetch(`${BASE}/api/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${exBody.idToken}` },
    body: form,
  })
  const text = await res.text()
  console.log('HTTP', res.status)
  console.log(text.slice(0, 600))

  if (text.includes('Non-civic content detected (food)')) {
    console.error('FAIL: still blocked by food keyword on production')
    process.exit(1)
  }
  if (res.status === 201) {
    console.log('PASS: production report created (food+waste not blocked)')
    return
  }
  if (res.status === 400 && !text.includes('food')) {
    console.log('PASS: intake gate passed (downstream validation only)')
    return
  }
  console.error('FAIL: unexpected response')
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
