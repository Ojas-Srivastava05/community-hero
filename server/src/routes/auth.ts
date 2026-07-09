import { Router } from 'express'
import { adminAuth, db } from '../lib/firebase-admin'
import { sendServerError } from '../lib/errors'

export const authRouter = Router()

const DEMO_USERS = {
  citizen: {
    uid: 'demo-citizen-v2ship',
    email: 'demo-citizen@community-hero.app',
    displayName: 'Demo Citizen',
  },
  admin: {
    uid: 'demo-admin-v2ship',
    email: 'demo-admin@community-hero.app',
    displayName: 'Demo Authority',
  },
} as const

async function ensureDemoUser(role: keyof typeof DEMO_USERS) {
  const profile = DEMO_USERS[role]
  try {
    await adminAuth.getUser(profile.uid)
  } catch {
    await adminAuth.createUser({
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      emailVerified: true,
    })
  }
  if (role === 'admin') {
    await adminAuth.setCustomUserClaims(profile.uid, { admin: true })
  } else {
    await adminAuth.setCustomUserClaims(profile.uid, { admin: false })
  }

  // Make demo accounts immediately eligible for boosts (24h age + prior report)
  const now = new Date().toISOString()
  const aged = new Date(Date.now() - 48 * 3600_000).toISOString()
  await db.collection('users').doc(profile.uid).set(
    {
      displayName: profile.displayName,
      email: profile.email,
      civicPoints: role === 'admin' ? 0 : 12,
      badges: role === 'admin' ? [] : ['First Reporter'],
      leaderboardOptIn: true,
      reportsCount: 1,
      isDemo: true,
      createdAt: aged,
      updatedAt: now,
    },
    { merge: true },
  )

  return adminAuth.createCustomToken(profile.uid, role === 'admin' ? { admin: true } : {})
}

authRouter.post('/demo-token', async (req, res) => {
  try {
    const role = req.body?.role === 'admin' ? 'admin' : 'citizen'
    const token = await ensureDemoUser(role)
    res.json({
      token,
      role,
      profile: DEMO_USERS[role],
    })
  } catch (e) {
    console.error('demo-token failed:', e)
    sendServerError(res, e)
  }
})

authRouter.get('/demo-status', (_req, res) => {
  res.json({ enabled: true, roles: Object.keys(DEMO_USERS) })
})
