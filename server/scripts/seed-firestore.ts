import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import ngeohash from 'ngeohash'
import { v4 as uuid } from 'uuid'

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
    const { lat, lng } = jitter(i)
    const id = uuid()
    await db.collection('issues').doc(id).set({
      title: d.title,
      description: `Demo issue (Appendix R): ${d.title} in Koramangala ward.`,
      category: d.category,
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
      departmentId: 'Roads & Infrastructure',
      upvoteCount: d.upvotes ?? 1,
      verificationLevel: (d.upvotes ?? 0) >= 3 ? 2 : 1,
      priorityScore: d.severity * 8,
      slaDeadline: new Date(Date.now() + 72 * 3600000).toISOString(),
      isDemo: true,
      createdAt: now,
      updatedAt: now,
      resolvedAt: d.status === 'Resolved' ? now : null,
    })
    n++
    console.log('Seeded:', id, d.title)
  }
  console.log('Done — seeded', n, 'issues')
}

main().catch(console.error)
