import ngeohash from 'ngeohash'
import { db } from '../src/lib/firebase-admin'
import { CATEGORIES, DEPARTMENTS, type Category } from '../src/types/shared'
import { computePriorityScore } from '../src/lib/priority'
import { getSlaHours } from '../src/lib/agents/routing'
import { currentWeekKey } from '../src/lib/gamification'

// ---------------------------------------------------------------------------
// Real, category-accurate photos (verified to load from the Unsplash CDN).
// Each key has a few variants so the demo doesn't repeat the same picture.
// ---------------------------------------------------------------------------
const UNSPLASH = 'https://images.unsplash.com'
const img = (slug: string) => `${UNSPLASH}/${slug}?w=800&q=80`
const IMAGES: Record<Category, string[]> = {
  pothole: ['photo-1741997246403-9607826b51b8', 'photo-1741996951192-f4762170f3cb'].map(img),
  road_damage: ['photo-1635068741358-ab1b9813623f', 'photo-1741996950906-5faf36413669'].map(img),
  waste: [
    'photo-1762805544423-a55e9ae98159',
    'photo-1762805545352-4ac5355b0f0b',
    'photo-1605600659908-0ef719419d41',
  ].map(img),
  streetlight: [
    'photo-1626006846694-f0852fa032f1',
    'photo-1560692659-467e4f0f3deb',
    'photo-1513828583688-c52646db42da',
  ].map(img),
  water_leak: ['photo-1526898943670-92bfa9f94c12', 'photo-1596394723269-b2cbca4e6313'].map(img),
  drainage: ['photo-1762624785174-a97cb4fa18f1', 'photo-1547683905-f686c993aae5'].map(img),
  signage: ['photo-1650041468205-a68deb96c4e3', 'photo-1650041468242-b16c6087a0d7'].map(img),
  encroachment: ['photo-1778243076785-2f91c80e7bf7', 'photo-1771206841973-f1b29fb77a52'].map(img),
  other: ['photo-1779179015285-120aaa822b1b', 'photo-1653701888795-a23335d9aee2'].map(img),
}

// ---------------------------------------------------------------------------
// Cities & real neighbourhood coordinates. Bengaluru is weighted heaviest so
// the map (which defaults to Bengaluru) opens on a dense, explorable cluster.
// ---------------------------------------------------------------------------
type Area = { name: string; lat: number; lng: number }
type City = { key: string; city: string; wardId: string; count: number; areas: Area[] }

const CITIES: City[] = [
  {
    key: 'blr',
    city: 'Bengaluru',
    wardId: 'BLR_WARD',
    count: 20,
    areas: [
      { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
      { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
      { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
      { name: 'Jayanagar', lat: 12.925, lng: 77.5938 },
      { name: 'Whitefield', lat: 12.9698, lng: 77.75 },
      { name: 'Bellandur', lat: 12.926, lng: 77.6762 },
      { name: 'Malleshwaram', lat: 13.0035, lng: 77.5647 },
    ],
  },
  {
    key: 'del',
    city: 'New Delhi',
    wardId: 'DEL_WARD',
    count: 8,
    areas: [
      { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
      { name: 'Saket', lat: 28.5245, lng: 77.2066 },
      { name: 'Dwarka', lat: 28.5921, lng: 77.046 },
      { name: 'Rohini', lat: 28.7433, lng: 77.067 },
    ],
  },
  {
    key: 'mum',
    city: 'Mumbai',
    wardId: 'MUM_WARD',
    count: 8,
    areas: [
      { name: 'Andheri', lat: 19.1197, lng: 72.8468 },
      { name: 'Bandra', lat: 19.0596, lng: 72.8295 },
      { name: 'Dadar', lat: 19.0178, lng: 72.8478 },
      { name: 'Powai', lat: 19.1176, lng: 72.906 },
    ],
  },
  {
    key: 'pun',
    city: 'Pune',
    wardId: 'PUN_WARD',
    count: 6,
    areas: [
      { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
      { name: 'Hinjewadi', lat: 18.5913, lng: 73.7389 },
      { name: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
    ],
  },
  {
    key: 'hyd',
    city: 'Hyderabad',
    wardId: 'HYD_WARD',
    count: 6,
    areas: [
      { name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
      { name: 'Madhapur', lat: 17.4483, lng: 78.3915 },
      { name: 'Banjara Hills', lat: 17.4156, lng: 78.4347 },
    ],
  },
]

// Realistic issue templates. {area}/{city} are interpolated at generation time.
type Kind = { category: Category; title: string; desc: string; severity: number }
const KINDS: Kind[] = [
  { category: 'pothole', severity: 4, title: 'Deep pothole near {area} bus stop', desc: 'A crater-sized pothole has opened on the main road through {area}, {city}. Two-wheelers keep swerving into oncoming traffic to avoid it.' },
  { category: 'pothole', severity: 3, title: 'Potholes along {area} main road', desc: 'Several potholes appeared after the recent rains near {area}. Cabs slow to a crawl here every morning and evening.' },
  { category: 'road_damage', severity: 4, title: 'Road caved in at {area} junction', desc: 'The tar has cracked and sunk near the {area} signal in {city}. The uneven surface is a real hazard for cyclists.' },
  { category: 'road_damage', severity: 3, title: 'Cracking service road in {area}', desc: 'Long cracks are spreading across the service road in {area}. They get visibly wider every week.' },
  { category: 'waste', severity: 3, title: 'Garbage pile-up at {area} market', desc: 'Uncollected waste has been rotting for days behind the {area} market in {city}. The smell is unbearable and stray dogs have gathered.' },
  { category: 'waste', severity: 4, title: 'Overflowing bin on {area} main road', desc: 'The community bin near {area} has not been cleared in over a week. Trash is now spilling onto the footpath.' },
  { category: 'streetlight', severity: 2, title: 'Streetlight out on {area} 5th Cross', desc: 'The streetlight opposite the park in {area} has been dark for two weeks, leaving the lane unsafe after 8pm.' },
  { category: 'streetlight', severity: 3, title: 'Whole stretch of dark streetlights in {area}', desc: 'An entire row of streetlights along {area}, {city} is not working. Residents now avoid walking here at night.' },
  { category: 'water_leak', severity: 5, title: 'Burst water main flooding {area} road', desc: 'A water board main has burst near {area} and clean water is gushing onto the road. Huge wastage and the surface is dangerously slippery.' },
  { category: 'water_leak', severity: 4, title: 'Constant leak at {area} valve', desc: 'A leaking valve near {area} has created a permanent puddle. Drinking water is being wasted around the clock.' },
  { category: 'drainage', severity: 5, title: 'Storm drain overflow floods {area}', desc: 'The stormwater drain near {area} is choked and overflows after every shower, flooding the {city} underpass knee-deep.' },
  { category: 'drainage', severity: 3, title: 'Open drain outside {area} school', desc: 'An uncovered drain right outside the school gate in {area}. A child could easily fall in.' },
  { category: 'signage', severity: 2, title: 'Missing traffic sign at {area} turn', desc: 'The no-entry sign at the {area} junction is bent and unreadable, causing confusion and wrong-way driving.' },
  { category: 'signage', severity: 2, title: 'Faded pedestrian sign in {area}', desc: 'The pedestrian crossing sign near {area} has faded completely. Drivers no longer slow down here.' },
  { category: 'encroachment', severity: 3, title: 'Footpath blocked by stalls in {area}', desc: 'Street stalls have taken over the entire footpath in {area}, {city}, forcing pedestrians onto the busy road.' },
  { category: 'encroachment', severity: 2, title: 'Lane encroachment in {area}', desc: 'Shops in {area} have extended onto the public lane, leaving almost no room to walk.' },
  { category: 'other', severity: 2, title: 'Broken footpath tiles in {area}', desc: 'The paver blocks on the {area} footpath are uprooted and uneven. Elderly residents have already tripped here.' },
  { category: 'other', severity: 3, title: 'Fallen tree branch blocking {area} road', desc: 'A large branch came down in the last storm and is still partly blocking the road in {area}.' },
]

const STATUS_CYCLE = [
  'Submitted',
  'Community Verified',
  'In Progress',
  'Submitted',
  'Assigned',
  'Resolved',
  'Community Verified',
  'In Progress',
  'Submitted',
  'Resolved',
]

const GOLDEN_ANGLE = 2.399963229728653

// Scatter points inside a ~100–450m spiral so no two markers stack (which used
// to make individual issues unclickable) but they stay within the neighbourhood.
function scatter(baseLat: number, baseLng: number, k: number): { lat: number; lng: number } {
  const radius = 0.0009 * Math.sqrt(k + 0.5)
  const angle = k * GOLDEN_ANGLE
  return {
    lat: +(baseLat + radius * Math.cos(angle)).toFixed(6),
    lng: +(baseLng + radius * Math.sin(angle)).toFixed(6),
  }
}

function fill(t: string, area: string, city: string): string {
  return t.replace(/\{area\}/g, area).replace(/\{city\}/g, city)
}

// Delete a document's `events` subcollection, then the document itself.
async function deleteIssueDeep(docId: string): Promise<void> {
  const eventsSnap = await db.collection('issues').doc(docId).collection('events').get()
  let batch = db.batch()
  let ops = 0
  for (const ev of eventsSnap.docs) {
    batch.delete(ev.ref)
    if (++ops >= 400) {
      await batch.commit()
      batch = db.batch()
      ops = 0
    }
  }
  if (ops > 0) await batch.commit()
  await db.collection('issues').doc(docId).delete()
}

// Remove ALL previously seeded demo issues so re-running never duplicates data.
async function clearDemoIssues(): Promise<number> {
  const seen = new Set<string>()
  let removed = 0
  for (const [field, value] of [
    ['isDemo', true],
    ['reporterId', 'demo-seed'],
  ] as const) {
    const snap = await db.collection('issues').where(field, '==', value).get()
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue
      seen.add(doc.id)
      await deleteIssueDeep(doc.id)
      removed++
    }
  }
  return removed
}

async function main() {
  const now = Date.now()
  const removed = await clearDemoIssues()
  console.log('Cleared', removed, 'existing demo issues')

  let gi = 0
  let n = 0
  for (const c of CITIES) {
    const areaK: Record<string, number> = {}
    for (let j = 0; j < c.count; j++) {
      const area = c.areas[j % c.areas.length]
      const k = (areaK[area.name] = (areaK[area.name] ?? 0) + 1) - 1
      const kind = KINDS[gi % KINDS.length]
      const category = (CATEGORIES.includes(kind.category) ? kind.category : 'other') as Category
      const dept = DEPARTMENTS[category]
      const { lat, lng } = scatter(area.lat, area.lng, k)
      const status = STATUS_CYCLE[gi % STATUS_CYCLE.length]
      const upvotes = 1 + ((gi * 3) % 12)
      // Newest issues first (Bengaluru), spread over the last ~40 days.
      const createdAtMs = now - gi * 13 * 3_600_000
      const createdAt = new Date(createdAtMs).toISOString()
      const slaHours = getSlaHours(category, kind.severity)
      const id = `demo-${c.key}-${String(j).padStart(2, '0')}`
      const address = `${area.name}, ${c.city}`

      await db.collection('issues').doc(id).set({
        title: fill(kind.title, area.name, c.city),
        description: fill(kind.desc, area.name, c.city),
        category,
        severity: kind.severity,
        status,
        lat,
        lng,
        address,
        geohash: ngeohash.encode(lat, lng, 7),
        wardId: `${c.wardId}_${area.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`,
        imageUrls: [IMAGES[category][gi % IMAGES[category].length]],
        ...(status === 'Resolved'
          ? {
              proofImageUrl: IMAGES[category][(gi + 1) % IMAGES[category].length],
              aiMetadata: {
                proofComparison: {
                  improved: true,
                  confidence: 0.82 + ((gi % 10) / 100),
                  summary:
                    'Before/after photos match the same location. Visible repair evidence confirms resolution.',
                },
              },
            }
          : {}),
        reporterId: 'demo-seed',
        reporterEmail: 'demo@community-hero.app',
        departmentId: dept.name,
        upvoteCount: upvotes,
        verificationLevel: upvotes >= 10 ? 3 : upvotes >= 3 ? 2 : 1,
        priorityScore: computePriorityScore(kind.severity, upvotes, kind.severity >= 4, createdAt),
        slaDeadline: new Date(createdAtMs + slaHours * 3_600_000).toISOString(),
        isDemo: true,
        createdAt,
        updatedAt: createdAt,
        resolvedAt: status === 'Resolved' ? createdAt : null,
      })

      const eventsRef = db.collection('issues').doc(id).collection('events')
      await eventsRef.add({ type: 'created', actorId: 'demo-seed', payload: { status: 'Submitted' }, timestamp: createdAt })
      if (status !== 'Submitted') {
        await eventsRef.add({ type: 'status_change', actorId: 'routing-agent', payload: { from: 'Submitted', to: status }, timestamp: createdAt })
      }
      if (status === 'Resolved') {
        await eventsRef.add({ type: 'resolved', actorId: 'admin', payload: { proof: true }, timestamp: createdAt })
      }

      n++
      gi++
    }
    console.log(`Seeded ${c.count} issues in ${c.city}`)
  }

  const weekKey = currentWeekKey()
  const demoUsers = [
    { uid: 'demo-champion-1', displayName: 'Priya K.', civicPoints: 125, weeklyPoints: 45, badges: ['First Reporter', 'Neighborhood Voice', 'Civic Champion'] },
    { uid: 'demo-champion-2', displayName: 'Arjun M.', civicPoints: 88, weeklyPoints: 55, badges: ['First Reporter', 'Verified Voice', 'Ward Guardian'] },
    { uid: 'demo-champion-3', displayName: 'Sneha R.', civicPoints: 62, weeklyPoints: 30, badges: ['First Reporter', 'Fix Follower'] },
    { uid: 'demo-champion-4', displayName: 'Rahul V.', civicPoints: 47, weeklyPoints: 22, badges: ['First Reporter', 'Verified Voice'] },
    { uid: 'demo-champion-5', displayName: 'Fatima S.', civicPoints: 33, weeklyPoints: 18, badges: ['First Reporter'] },
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
        isDemo: true,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
      { merge: true },
    )
  }
  console.log('Seeded', demoUsers.length, 'leaderboard users')
  console.log('Done — seeded', n, 'issues across', CITIES.length, 'cities')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
