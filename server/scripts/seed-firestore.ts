import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import ngeohash from 'ngeohash'
import { v4 as uuid } from 'uuid'
import { CATEGORIES, DEPARTMENTS, type Category } from '../src/types/shared'
import { computePriorityScore } from '../src/lib/priority'
import { getSlaHours } from '../src/lib/agents/routing'
import { currentWeekKey } from '../src/lib/gamification'

const projectId = process.env.FIREBASE_PROJECT_ID || 'community-hero-vibe2ship'
initializeApp({ credential: applicationDefault(), projectId })
const db = getFirestore()

// Appendix R: 25 demo issues in Koramangala cluster
const BASE = { lat: 12.9352, lng: 77.6245 }
const jitter = (i: number) => ({
  lat: BASE.lat + (Math.sin(i) * 0.008),
  lng: BASE.lng + (Math.cos(i) * 0.008),
})

const SPECS: Array<{
  title: string
  category: string
  severity: number
  status: string
  upvotes?: number
}> = [
  ...Array.from({ length: 5 }, (_, i) => ({ title: `Pothole on ${i + 1}st Cross`, category: 'pothole', severity: 4, status: i < 2 ? 'Community Verified' : 'Submitted', upvotes: i < 2 ? 5 : 1 })),
  ...Array.from({ length: 4 }, (_, i) => ({ title: `Waste dump block ${i + 1}`, category: 'waste', severity: 3, status: 'Submitted', upvotes: 1 })),
  ...Array.from({ length: 3 }, (_, i) => ({ title: `Streetlight out #${i + 1}`, category: 'streetlight', severity: 2, status: 'In Progress', upvotes: 2 })),
  ...Array.from({ length: 3 }, (_, i) => ({ title: `Water leak pipe ${i + 1}`, category: 'water_leak', severity: 5, status: 'Assigned', upvotes: 1 })),
  ...Array.from({ length: 2 }, (_, i) => ({ title: `Road crack segment ${i + 1}`, category: 'road_damage', severity: 4, status: 'Submitted', upvotes: 1 })),
  ...Array.from({ length: 2 }, (_, i) => ({ title: `Blocked drain ${i + 1}`, category: 'drainage', severity: 3, status: 'Submitted', upvotes: 1 })),
  { title: 'Resolved pothole with proof', category: 'pothole', severity: 3, status: 'Resolved', upvotes: 3 },
  { title: 'Resolved waste clearance', category: 'waste', severity: 2, status: 'Resolved', upvotes: 2 },
  { title: 'Community verified encroachment', category: 'encroachment', severity: 3, status: 'Community Verified', upvotes: 6 },
  { title: 'Community verified signage damage', category: 'signage', severity: 2, status: 'Community Verified', upvotes: 4 },
  { title: 'Large pothole near metro pillar', category: 'pothole', severity: 4, status: 'Community Verified', upvotes: 5 },
  { title: 'Garbage blackspot on 12th Main', category: 'waste', severity: 3, status: 'Submitted', upvotes: 1 },
  { title: 'Broken streetlight at junction', category: 'streetlight', severity: 2, status: 'In Progress', upvotes: 2 },
  { title: 'Water leak flooding sidewalk', category: 'water_leak', severity: 5, status: 'Assigned', upvotes: 1 },
]

const IMAGES: Record<string, string> = {
  pothole: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
  waste: 'https://images.unsplash.com/photo-1530587191325-3db28176de87?w=400',
  streetlight: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400',
  water_leak: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  signage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
  road_damage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
  drainage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  encroachment: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
}

async function main() {
  const now = new Date().toISOString()
  let n = 0
  for (let i = 0; i < SPECS.length; i++) {
    const d = SPECS[i]
    const category = (CATEGORIES.includes(d.category as Category) ? d.category : 'other') as Category
    const dept = DEPARTMENTS[category]
    const { lat, lng } = jitter(i)
    const id = uuid()
    const createdAt = now
    const slaHours = getSlaHours(category, d.severity)
    await db.collection('issues').doc(id).set({
      title: d.title,
      description: `Demo issue (Appendix R): ${d.title} in Koramangala ward.`,
      category,
      severity: d.severity,
      status: d.status,
      lat,
      lng,
      address: 'Koramangala, Bengaluru',
      geohash: ngeohash.encode(lat, lng, 7),
      wardId: 'DEMO_WARD_001',
      imageUrls: [IMAGES[d.category] || IMAGES.pothole],
      reporterId: 'demo-seed',
      reporterEmail: 'demo@community-hero.app',
      departmentId: dept.name,
      upvoteCount: d.upvotes ?? 1,
      verificationLevel: (d.upvotes ?? 0) >= 3 ? 2 : 1,
      priorityScore: computePriorityScore(d.severity, d.upvotes ?? 1, d.severity >= 4, createdAt),
      slaDeadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
      isDemo: true,
      createdAt,
      updatedAt: now,
      resolvedAt: d.status === 'Resolved' ? now : null,
    })

    const eventsRef = db.collection('issues').doc(id).collection('events')
    await eventsRef.add({
      type: 'created',
      actorId: 'demo-seed',
      payload: { status: 'Submitted' },
      timestamp: now,
    })
    if (d.status !== 'Submitted') {
      await eventsRef.add({
        type: 'status_change',
        actorId: 'routing-agent',
        payload: { from: 'Submitted', to: d.status },
        timestamp: now,
      })
    }
    if (d.status === 'Resolved') {
      await eventsRef.add({
        type: 'resolved',
        actorId: 'admin',
        payload: { proof: true },
        timestamp: now,
      })
    }
    n++
    console.log('Seeded:', id, d.title)
  }

  const weekKey = currentWeekKey()

  const demoUsers = [
    {
      uid: 'demo-champion-1',
      displayName: 'Priya K.',
      civicPoints: 125,
      weeklyPoints: 45,
      badges: ['First Reporter', 'Neighborhood Voice', 'Civic Champion'],
    },
    {
      uid: 'demo-champion-2',
      displayName: 'Arjun M.',
      civicPoints: 88,
      weeklyPoints: 55,
      badges: ['First Reporter', 'Verified Voice', 'Ward Guardian'],
    },
    {
      uid: 'demo-champion-3',
      displayName: 'Sneha R.',
      civicPoints: 62,
      weeklyPoints: 30,
      badges: ['First Reporter', 'Fix Follower'],
    },
  ]

  for (const u of demoUsers) {
    await db.collection('users').doc(u.uid).set(
      {
        displayName: u.displayName,
        civicPoints: u.civicPoints,
        weeklyPoints: u.weeklyPoints,
        weeklyPointsWeek: weekKey,
        badges: u.badges,
        leaderboardOptIn: true,
        reportsCount: 5,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    )
    console.log('Seeded leaderboard user:', u.displayName)
  }

  console.log('Done — seeded', n, 'issues +', demoUsers.length, 'leaderboard users')
}

main().catch(console.error)
