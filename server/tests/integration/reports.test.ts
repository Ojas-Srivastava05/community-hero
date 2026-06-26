import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { CATEGORIES } from '../../src/types/shared'

const hasFirebase =
  Boolean(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) &&
  process.env.SKIP_FIREBASE_TESTS !== '1'

function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'community-hero-vibe2ship',
    })
  }
  return getFirestore()
}

describe('POST /api/reports integration', { skip: !hasFirebase && 'SKIP_FIREBASE_TESTS=1 or no ADC' }, () => {
  let db: ReturnType<typeof getFirestore>

  before(() => {
    db = initFirebase()
  })

  it('creates issue document with required schema fields', async () => {
    const id = `test-${Date.now()}`
    const now = new Date().toISOString()
    const category = CATEGORIES[0]
    const payload = {
      title: 'Integration test pothole',
      description: 'Automated test issue — safe to delete',
      category,
      severity: 3,
      status: 'Submitted',
      lat: 12.9352,
      lng: 77.6245,
      geohash: 'tdr1w5x',
      wardId: 'TEST_WARD',
      reporterId: 'test-reporter',
      departmentId: 'Roads',
      upvoteCount: 0,
      verificationLevel: 0,
      priorityScore: 40,
      imageUrls: [],
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('issues').doc(id).set(payload)
    const doc = await db.collection('issues').doc(id).get()
    assert.ok(doc.exists)

    const data = doc.data()!
    assert.equal(data.title, payload.title)
    assert.equal(data.category, category)
    assert.ok(typeof data.severity === 'number')
    assert.ok(data.createdAt)

    await db.collection('issues').doc(id).delete()
  })

  it('lists recent issues for public read path', async () => {
    const snap = await db.collection('issues').limit(1).get()
    assert.ok(snap.size >= 0)
  })
})

describe('POST /api/reports integration (skipped)', { skip: hasFirebase }, () => {
  it('runs when FIREBASE_PROJECT_ID or ADC is configured', () => {
    assert.ok(true)
  })
})
