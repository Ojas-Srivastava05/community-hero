#!/usr/bin/env node
/**
 * Capture submission screenshots (390×844) from production Cloud Run.
 * All shots use the live deploy so Firebase, Maps, and demo data match judging.
 *
 * Usage: npm run screenshots
 */
import { chromium, devices } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../docs/submission/screenshots')
const PROD = 'https://community-hero-987477089222.asia-south1.run.app'

const SHOTS = [
  {
    file: '01-landing.png',
    path: '/',
    setup: async (page) => {
      await waitForText(page, /city that listens|Community Hero/i)
      await waitMinTotal(page, 10)
      await page.waitForTimeout(2000)
    },
    assert: async () => {
      requireText(/Community Hero|city that listens/i)
    },
  },
  {
    file: '02-map.png',
    path: '/map',
    setup: async (page) => {
      await waitForMaps(page)
      await page.waitForTimeout(2500)
    },
    assert: async (page) => {
      forbid('Something went wrong')
      forbid("didn't load Google Maps")
      const hasMap = await page.locator('.gm-style, canvas').count()
      if (hasMap < 1) throw new Error('map not rendered')
    },
  },
  {
    file: '03-report.png',
    path: '/report',
    needsAuth: true,
    setup: async (page) => {
      await waitForText(page, /Report an issue|Step 1|Capture/i)
      await page.waitForTimeout(1000)
    },
    assert: async () => {
      requireText(/Step 1|Capture/i)
      requireText(/Photo|Voice|Video/i)
    },
  },
  {
    file: '04-dashboard.png',
    path: '/dashboard',
    setup: async (page) => {
      await waitForText(page, /Civic dashboard|Impact|Total/i)
      await waitMinTotal(page, 10)
      await page.waitForTimeout(2000)
    },
    assert: async () => {
      forbid('Loading…')
      requireText(/Total|Open|Resolved/i)
    },
  },
  {
    file: '05-leaderboard.png',
    path: '/leaderboard',
    setup: async (page) => {
      await waitForText(page, /Leaderboard/i)
      await page.waitForTimeout(1500)
    },
    assert: async () => {
      requireText(/All-time|Weekly/i)
    },
  },
  {
    file: '06-assistant.png',
    path: '/assistant',
    needsAuth: true,
    setup: async (page) => {
      await waitForText(page, /Civic AI|Try asking/i, 20_000)
      await page.waitForTimeout(1000)
    },
    assert: async () => {
      forbid('Sign in to chat')
      requireText(/Civic AI|Try asking|हिंदी/i)
    },
  },
  {
    file: '07-scorecards.png',
    path: '/scorecards',
    setup: async (page) => {
      await waitForText(page, /Department|accountability|Scorecard/i, 15_000)
      await page.waitForTimeout(1500)
    },
    assert: async () => {
      requireText(/resolved|SLA|grade/i)
    },
  },
  {
    file: '08-login.png',
    path: '/login',
    needsSignOut: true,
    setup: async (page) => {
      await waitForText(page, /Sign in/i)
    },
    assert: async () => {
      requireText(/demo citizen|demo authority/i)
      requireText(/Google|guest/i)
    },
  },
  {
    file: '09-embed.png',
    path: '/embed/map?lat=12.9716&lng=77.5946',
    setup: async (page) => {
      await page.waitForTimeout(3000)
      await waitForMaps(page).catch(() => {})
    },
    assert: async (page) => {
      const hasMap = await page.locator('.gm-style, canvas, [class*="map"]').count()
      if (hasMap < 1) throw new Error('embed map not rendered')
    },
  },
]

let bodyCache = ''

function forbid(text) {
  if (bodyCache.includes(text)) throw new Error(`forbidden text: ${text}`)
}

function requireText(re) {
  if (!re.test(bodyCache)) throw new Error(`missing: ${re}`)
}

async function refreshBody(page) {
  bodyCache = await page.innerText('body')
}

async function waitForText(page, re, timeout = 15_000) {
  await page.waitForFunction(
    ({ pattern, f }) => new RegExp(pattern, f).test(document.body.innerText),
    { pattern: re.source, f: re.flags.replace('g', '') },
    { timeout },
  )
}

async function waitMinTotal(page, min) {
  await page
    .waitForFunction(
      (n) => {
        const text = document.body.innerText
        const m =
          text.match(/TOTAL[\s\n]*(\d+)/i) ||
          text.match(/Total[\s\n]*(\d+)/i) ||
          text.match(/(\d+)\s+open issues/i)
        return m && Number(m[1]) >= n
      },
      min,
      { timeout: 30_000 },
    )
    .catch(() => {})
}

async function waitForMaps(page) {
  await page.waitForFunction(
    () => {
      const t = document.body.innerText
      if (t.includes('Something went wrong') && t.includes('Google Maps')) return false
      return document.querySelector('.gm-style') != null || document.querySelectorAll('canvas').length > 0
    },
    { timeout: 35_000 },
  )
}

async function contextClearAuth(page) {
  await page
    .evaluate(async () => {
      localStorage.clear()
      sessionStorage.clear()
      const dbs = await indexedDB.databases?.()
      for (const db of dbs ?? []) {
        if (db.name) indexedDB.deleteDatabase(db.name)
      }
    })
    .catch(() => {})
}

async function demoSignIn(page) {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const btn = page.getByRole('button', { name: /Enter as demo citizen|demo citizen/i })
  await btn.click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 })
  await page.waitForTimeout(1500)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const device = devices['iPhone 13']
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...device,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    geolocation: { latitude: 12.9716, longitude: 77.5946 },
    permissions: ['geolocation'],
  })
  const page = await context.newPage()
  const audit = []

  const res = await page.goto(PROD, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  if (!res?.ok()) throw new Error(`Cannot reach ${PROD}`)

  let signedIn = false

  for (const shot of SHOTS) {
    process.stdout.write(`Capturing ${shot.file}… `)
    try {
      if (shot.needsSignOut) {
        await contextClearAuth(page)
        await page.context().clearCookies()
        signedIn = false
      } else if (shot.needsAuth) {
        if (!signedIn) {
          await contextClearAuth(page)
          await page.context().clearCookies()
          await demoSignIn(page)
          signedIn = true
        }
      } else if (!shot.needsAuth && !shot.needsSignOut) {
        // Public pages — stay signed out for neutral captures unless already on auth flow
      }

      await page.goto(`${PROD}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await refreshBody(page)
      if (shot.setup) await shot.setup(page)
      await refreshBody(page)
      if (shot.assert) await shot.assert(page)

      await page.screenshot({ path: path.join(OUT_DIR, shot.file), fullPage: false })
      audit.push({ file: shot.file, status: 'ok', route: shot.path })
      console.log('ok')
    } catch (e) {
      audit.push({ file: shot.file, status: 'fail', error: String(e.message || e), route: shot.path })
      console.log(`FAIL — ${e.message || e}`)
    }
  }

  await browser.close()
  const reportPath = path.join(OUT_DIR, 'audit.json')
  await writeFile(
    reportPath,
    JSON.stringify({ capturedAt: new Date().toISOString(), base: PROD, shots: audit }, null, 2),
  )
  const failed = audit.filter((a) => a.status === 'fail')
  if (failed.length) {
    console.error(`\n${failed.length} failed — see ${reportPath}`)
    process.exit(1)
  }
  console.log(`\nAll ${audit.length} screenshots saved to ${OUT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
