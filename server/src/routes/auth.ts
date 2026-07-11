import { Router } from 'express'
import ngeohash from 'ngeohash'
import { adminAuth, db } from '../lib/firebase-admin'
import { sendServerError } from '../lib/errors'
import { computePriorityScore } from '../lib/priority'
import { getSlaHours } from '../lib/agents/routing'

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

/** Demo judge-queue tickets for finals — low-confidence / Draft items authorities must approve. */
async function ensureJudgeDemoIssues() {
  const now = Date.now()
  const items = [
    {
      id: 'demo-judge-01',
      title: 'Unclear roadside debris — needs classification',
      description:
        'Citizen photo shows mixed rubble and vegetation. AI confidence was below threshold; authority must confirm category and severity.',
      category: 'other' as const,
      severity: 2,
      lat: 12.9352,
      lng: 77.6245,
      address: 'Koramangala, Bengaluru',
      wardId: 'BLR_WARD_KORAMANG',
      imageUrl:
        'https://images.unsplash.com/photo-1779179015285-120aaa822b1b?w=800&q=80',
    },
    {
      id: 'demo-judge-02',
      title: 'Possible water leak or drainage overflow',
      description:
        'Standing water on road — vision model split between water_leak and drainage. Judge must pick routing before publish.',
      category: 'water_leak' as const,
      severity: 4,
      lat: 28.6315,
      lng: 77.2167,
      address: 'Connaught Place, New Delhi',
      wardId: 'DEL_WARD_CONNAUGH',
      imageUrl:
        'https://images.unsplash.com/photo-1526898943670-92bfa9f94c12?w=800&q=80',
    },
    {
      id: 'demo-judge-03',
      title: 'Image not clearly civic infrastructure',
      description:
        'Submitted media may be unrelated to municipal issues. Review before publishing to the public map.',
      category: 'other' as const,
      severity: 1,
      lat: 19.1197,
      lng: 72.8468,
      address: 'Andheri, Mumbai',
      wardId: 'MUM_WARD_ANDHERI',
      imageUrl:
        'https://images.unsplash.com/photo-1653701888795-a23335d9aee2?w=800&q=80',
    },
  ]

  for (const item of items) {
    const ref = db.collection('issues').doc(item.id)
    const snap = await ref.get()
    if (snap.exists && snap.data()?.status === 'Draft') continue

    const createdAt = new Date(now - 2 * 3_600_000).toISOString()
    const slaHours = getSlaHours(item.category, item.severity)
    await ref.set({
      title: item.title,
      description: item.description,
      category: item.category,
      severity: item.severity,
      status: 'Draft',
      lat: item.lat,
      lng: item.lng,
      address: item.address,
      geohash: ngeohash.encode(item.lat, item.lng, 7),
      wardId: item.wardId,
      imageUrls: [item.imageUrl],
      reporterId: 'demo-seed',
      reporterEmail: 'demo@community-hero.app',
      departmentId: 'General Civic',
      upvoteCount: 0,
      verificationLevel: 0,
      priorityScore: computePriorityScore(item.severity, 0, false, createdAt),
      slaDeadline: new Date(now + slaHours * 3_600_000).toISOString(),
      aiMetadata: {
        needs_review: true,
        confidence: 0.42,
        reviewReason: 'Low AI confidence — authority confirmation required',
      },
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
    })
  }
}

authRouter.post('/demo-token', async (req, res) => {
  try {
    const role = req.body?.role === 'admin' ? 'admin' : 'citizen'
    const token = await ensureDemoUser(role)
    if (role === 'admin') {
      await ensureJudgeDemoIssues().catch((e) => console.warn('judge demo seed:', e))
    }
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
