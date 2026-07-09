#!/usr/bin/env node
/**
 * Capture submission screenshots (390×844).
 * Production: map + rich demo data (49 issues). Local: new UI (demo login, scorecards, Hindi).
 *
 * Prereqs:
 *   npm run dev   (with GOOGLE_APPLICATION_CREDENTIALS for demo auth on assistant shot)
 * Usage:
 *   npm run screenshots
 */
import { chromium, devices } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../docs/submission/screenshots')
const PROD = 'https://community-hero-987477089222.asia-south1.run.app'
const LOCAL = 'http://localhost:5173'

const SHOTS = [
  {
    file: '01-landing.png',
    base: PROD,
    path: '/',
    setup: async (page) => {
      await waitForText(page, /city that listens|CivicPulse/i)
      await waitMinTotal(page, 10)
      await page.waitForTimeout(2000)
    },
    assert: async (page) => {
      forbid(page, 'Location unavailable — showing all issues')
      requireText(page, /CivicPulse|city that listens/i)
    },
  },
  {
    file: '02-map.png',
    base: PROD,
    path: '/map',
    setup: async (page) => {
      await waitForMaps(page)
      await page.waitForTimeout(2500)
      // Close issue card so markers are visible
      const closeBtn = page.locator('button').filter({ has: page.locator('svg') }).last()
      await closeBtn.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(500)
    },
    assert: async (page) => {
      forbid(page, 'Something went wrong')
      forbid(page, "didn't load Google Maps")
      const hasMap = await page.locator('.gm-style, canvas').count()
      if (hasMap < 1) throw new Error('map not rendered')
    },
  },
  {
    file: '03-report.png',
    base: LOCAL,
    path: '/report',
    setup: async (page) => {
      await waitForText(page, /Report an issue|Step 1/i)
    },
    assert: async (page) => {
      requireText(page, /Step 1|Capture/i)
      requireText(page, /demo citizen|Try as demo/i)
    },
  },
  {
    file: '04-dashboard.png',
    base: PROD,
    path: '/dashboard',
    setup: async (page) => {
      await waitForText(page, /Civic dashboard/i)
      await waitMinTotal(page, 10)
      await page.waitForTimeout(2000)
    },
    assert: async (page) => {
      forbid(page, 'Loading…')
      requireText(page, /Total/i)
    },
  },
  {
    file: '05-leaderboard.png',
    base: PROD,
    path: '/leaderboard',
    setup: async (page) => {
      await waitForText(page, /Leaderboard/i)
      await page.waitForTimeout(1500)
    },
    assert: async (page) => {
      requireText(page, /All-time|Weekly/i)
      requireText(page, /pts|points/i)
    },
  },
  {
    file: '06-assistant.png',
    base: LOCAL,
    path: '/assistant',
    needsAuth: true,
    setup: async (page) => {
      await waitForText(page, /Civic AI|Try asking/i, 20_000)
      forbid(page, 'Sign in to chat')
      await page.waitForTimeout(1000)
    },
    assert: async (page) => {
      forbid(page, 'Sign in to chat')
      requireText(page, /Civic AI|Try asking|हिंदी/i)
    },
  },
  {
    file: '07-scorecards.png',
    base: LOCAL,
    path: '/scorecards',
    setup: async (page) => {
      await waitForText(page, /Department|accountability/i, 15_000)
      await page.waitForTimeout(1500)
    },
    assert: async (page) => {
      requireText(page, /resolved|SLA/i)
    },
  },
  {
    file: '08-login.png',
    base: LOCAL,
    path: '/login',
    setup: async (page) => {
      await signOut(page, LOCAL)
      await page.goto(`${LOCAL}/login`, { waitUntil: 'domcontentloaded' })
      await waitForText(page, /Sign in/i)
    },
    assert: async (page) => {
      requireText(page, /demo citizen|demo authority/i)
      requireText(page, /Google/i)
    },
  },
]

let bodyCache = ''

function forbid(_page, text) {
  if (bodyCache.includes(text)) throw new Error(`forbidden text: ${text}`)
}

function requireText(_page, re) {
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
  await page.waitForFunction(
    (n) => {
      const text = document.body.innerText
      const m = text.match(/TOTAL[\s\n]*(\d+)/i) || text.match(/Total[\s\n]*(\d+)/i) || text.match(/(\d+)\s+open issues/i)
      return m && Number(m[1]) >= n
    },
    min,
    { timeout: 30_000 },
  ).catch(() => {})
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

async function signOut(page, base) {
  await page.goto(`${base}/profile`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {})
  const logout = page.getByRole('button', { name: /log out|sign out/i })
  if (await logout.count()) {
    await logout.click()
    await page.waitForTimeout(1500)
  }
  await contextClearAuth(page)
}

async function contextClearAuth(page) {
  await page.evaluate(async () => {
    localStorage.clear()
    sessionStorage.clear()
    const dbs = await indexedDB.databases?.()
    for (const db of dbs ?? []) {
      if (db.name) indexedDB.deleteDatabase(db.name)
    }
  }).catch(() => {})
}

async function demoSignIn(page, base) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const btn = page.getByRole('button', { name: /demo citizen|Enter as demo citizen/i })
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

  // Sanity: local + prod reachable
  for (const url of [LOCAL, PROD]) {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    if (!res?.ok()) throw new Error(`Cannot reach ${url}`)
  }

  for (const shot of SHOTS) {
    const base = shot.base
    process.stdout.write(`Capturing ${shot.file} (${base})… `)
    try {
      if (shot.needsAuth) {
        await demoSignIn(page, LOCAL)
      } else if (shot.file === '08-login.png') {
        // handled in setup
      } else {
        await contextClearAuth(page)
        await page.context().clearCookies()
      }

      await page.goto(`${base}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
      await refreshBody(page)
      if (shot.setup) await shot.setup(page)
      await refreshBody(page)
      if (shot.assert) await shot.assert(page)

      await page.screenshot({ path: path.join(OUT_DIR, shot.file), fullPage: false })
      audit.push({ file: shot.file, status: 'ok', base, route: shot.path })
      console.log('ok')
    } catch (e) {
      audit.push({ file: shot.file, status: 'fail', error: String(e.message || e), base, route: shot.path })
      console.log(`FAIL — ${e.message || e}`)
    }
  }

  await browser.close()
  const reportPath = path.join(OUT_DIR, 'audit.json')
  await writeFile(reportPath, JSON.stringify({ capturedAt: new Date().toISOString(), shots: audit }, null, 2))
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
