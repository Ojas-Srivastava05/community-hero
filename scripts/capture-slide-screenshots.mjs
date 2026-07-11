#!/usr/bin/env node
/**
 * Capture presentation slide screenshots (390×844) → presentation preparation/slide-images/
 * Audits each shot before saving. Reuses production deploy + demo citizen where needed.
 */
import { chromium, devices } from 'playwright'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../presentation preparation/slide-images')
const PROD = process.argv.find((a) => a.startsWith('--base='))?.slice(7)
  || 'https://community-hero-987477089222.asia-south1.run.app'
const ISSUE_ID = 'demo-blr-01'

const SHOTS = [
  {
    file: 'slide-01-landing-screenshot.png',
    slide: 1,
    path: '/',
    setup: async (page) => {
      await waitForText(page, /city that listens|Community Hero/i)
      await waitMinTotal(page, 10)
      await page.waitForTimeout(2000)
    },
    assert: async () => {
      requireText(/Community Hero|city that listens/i)
      forbid('Something went wrong')
    },
  },
  {
    file: 'slide-10-01-landing.png',
    slide: 10,
    path: '/',
    setup: async (page) => {
      await waitForText(page, /city that listens/i)
      await page.waitForTimeout(1500)
    },
    assert: async () => requireText(/city that listens/i),
  },
  {
    file: 'slide-10-02-report-wizard.png',
    slide: 10,
    path: '/report',
    needsSignOut: true,
    setup: async (page) => {
      await waitForText(page, /Report an issue|Step 1|Capture/i)
      await page.waitForTimeout(1000)
    },
    assert: async () => {
      requireText(/Step 1|Capture/i)
      requireText(/Photo|Voice|Video/i)
      forbid('Welcome to Community Hero')
    },
  },
  {
    file: 'slide-10-03-map-explorer.png',
    slide: 10,
    path: '/map',
    setup: async (page) => {
      await waitForMaps(page)
      await page.waitForTimeout(2500)
    },
    assert: async (page) => {
      forbid("didn't load Google Maps")
      const hasMap = await page.locator('.gm-style, canvas').count()
      if (hasMap < 1) throw new Error('map not rendered')
    },
  },
  {
    file: 'slide-10-04-issue-detail.png',
    slide: 10,
    path: `/issues/${ISSUE_ID}`,
    setup: async (page) => {
      await waitForText(page, /Potholes|Indiranagar|Boost|Community/i, 20_000)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35))
      await page.waitForTimeout(800)
    },
    assert: async () => {
      requireText(/Indiranagar|Pothole/i)
      forbid('Issue not found')
    },
  },
  {
    file: 'slide-10-05-dashboard.png',
    slide: 10,
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
    file: 'slide-10-06-leaderboard.png',
    slide: 10,
    path: '/leaderboard',
    setup: async (page) => {
      await waitForText(page, /Leaderboard/i)
      await page.waitForTimeout(1500)
    },
    assert: async () => requireText(/All-time|Weekly/i),
  },
  {
    file: 'slide-05-admin-console.png',
    slide: 5,
    path: '/admin',
    needsAdmin: true,
    setup: async (page) => {
      await page.evaluate(() => {
        localStorage.setItem('ch-onboarding-dismissed-admin', '1')
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await waitForText(page, /Operations queue|Authority|Judge/i, 20_000)
      await page.waitForTimeout(1500)
    },
    assert: async () => {
      requireText(/Operations queue|Judge|New|SLA/i)
      forbid('Access denied')
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
  const btn = page.getByRole('button', { name: /Submit without login|Enter as demo citizen|demo citizen/i })
  await btn.click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 })
  await page.waitForTimeout(1500)
}

async function demoAdminSignIn(page) {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  const btn = page.getByRole('button', { name: /Enter as demo authority|demo authority/i })
  await btn.click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 })
  await page.evaluate(() => {
    localStorage.setItem('ch-onboarding-dismissed-admin', '1')
  })
  await page.waitForTimeout(1500)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  // Ensure QR is present
  await copyFile(
    path.join(__dirname, '../docs/demo/qr-production.png'),
    path.join(OUT_DIR, 'slide-05-qr-code.png'),
  ).catch(() => {})

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
  let signedInAdmin = false

  for (const shot of SHOTS) {
    process.stdout.write(`Capturing ${shot.file}… `)
    try {
      if (shot.needsSignOut) {
        await contextClearAuth(page)
        await page.context().clearCookies()
        signedIn = false
        signedInAdmin = false
      } else if (shot.needsAdmin) {
        if (!signedInAdmin) {
          await contextClearAuth(page)
          await page.context().clearCookies()
          await demoAdminSignIn(page)
          signedInAdmin = true
          signedIn = false
        }
      } else if (shot.needsAuth) {
        if (!signedIn) {
          await contextClearAuth(page)
          await page.context().clearCookies()
          await demoSignIn(page)
          signedIn = true
          signedInAdmin = false
        }
      } else {
        if (signedIn || signedInAdmin) {
          // Public pages look better signed out for landing
          await contextClearAuth(page)
          await page.context().clearCookies()
          signedIn = false
          signedInAdmin = false
        }
      }

      await page.goto(`${PROD}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await refreshBody(page)
      if (shot.setup) await shot.setup(page)
      await refreshBody(page)
      if (shot.assert) await shot.assert(page)

      await page.screenshot({ path: path.join(OUT_DIR, shot.file), fullPage: false })
      audit.push({ file: shot.file, slide: shot.slide, status: 'ok', route: shot.path })
      console.log('ok')
    } catch (e) {
      audit.push({
        file: shot.file,
        slide: shot.slide,
        status: 'fail',
        error: String(e.message || e),
        route: shot.path,
      })
      console.log(`FAIL — ${e.message || e}`)
    }
  }

  await browser.close()
  const reportPath = path.join(OUT_DIR, 'screenshots-audit.json')
  await writeFile(
    reportPath,
    JSON.stringify({ capturedAt: new Date().toISOString(), base: PROD, issueId: ISSUE_ID, shots: audit }, null, 2),
  )
  const failed = audit.filter((a) => a.status === 'fail')
  if (failed.length) {
    console.error(`\n${failed.length} failed — see ${reportPath}`)
    process.exit(1)
  }
  console.log(`\nAll ${audit.length} slide screenshots saved to ${OUT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
