import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import ngeohash from 'ngeohash'
import { v4 as uuid } from 'uuid'

const projectId = process.env.FIREBASE_PROJECT_ID || 'community-hero-vibe2ship'
initializeApp({ credential: applicationDefault(), projectId })
const db = getFirestore()

const DEMO_ISSUES = [
  { title: 'Large pothole near metro pillar', category: 'pothole', severity: 4, lat: 12.9352, lng: 77.6245, status: 'Community Verified', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
  { title: 'Garbage blackspot on 12th Main', category: 'waste', severity: 3, lat: 12.932, lng: 77.628, status: 'Submitted', image: 'https://images.unsplash.com/photo-1530587191325-3db28176de87?w=400' },
  { title: 'Broken streetlight at junction', category: 'streetlight', severity: 2, lat: 12.938, lng: 77.62, status: 'In Progress', image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400' },
  { title: 'Water leak flooding sidewalk', category: 'water_leak', severity: 5, lat: 12.93, lng: 77.635, status: 'Assigned', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400' },
  { title: 'Damaged road signage', category: 'signage', severity: 2, lat: 12.942, lng: 77.615, status: 'Resolved', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400' },
]

async function main() {
  const now = new Date().toISOString()
  for (const d of DEMO_ISSUES) {
    const id = uuid()
    await db.collection('issues').doc(id).set({
      title: d.title,
      description: `Demo issue: ${d.title} in Koramangala ward.`,
      category: d.category,
      severity: d.severity,
      status: d.status,
      lat: d.lat,
      lng: d.lng,
      address: 'Koramangala, Bengaluru',
      geohash: ngeohash.encode(d.lat, d.lng, 7),
      wardId: 'Koramangala',
      imageUrls: [d.image],
      reporterId: 'demo-seed',
      reporterEmail: 'demo@community-hero.app',
      departmentId: 'Roads & Infrastructure',
      upvoteCount: d.status === 'Community Verified' ? 5 : 1,
      verificationLevel: d.status === 'Community Verified' ? 2 : 1,
      priorityScore: d.severity * 8,
      slaDeadline: new Date(Date.now() + 72 * 3600000).toISOString(),
      createdAt: now,
      updatedAt: now,
      resolvedAt: d.status === 'Resolved' ? now : null,
    })
    console.log('Seeded:', id, d.title)
  }
  console.log('Done — seeded', DEMO_ISSUES.length, 'issues')
}

main().catch(console.error)
