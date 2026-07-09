import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { CATEGORIES, DEPARTMENTS, OPEN311_SERVICE_CODES } from '../src/types/shared'

const projectId = process.env.FIREBASE_PROJECT_ID || 'community-hero-vibe2ship'
initializeApp({ credential: applicationDefault(), projectId })
const db = getFirestore()

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const now = new Date().toISOString()
  const byName = new Map<
    string,
    { categories: string[]; serviceCodes: string[]; slaHoursBySeverity: Record<number, number> }
  >()

  for (const category of CATEGORIES) {
    const dept = DEPARTMENTS[category]
    const existing = byName.get(dept.name) ?? {
      categories: [],
      serviceCodes: [],
      slaHoursBySeverity: { ...dept.slaHours },
    }
    existing.categories.push(category)
    existing.serviceCodes.push(OPEN311_SERVICE_CODES[category])
    byName.set(dept.name, existing)
  }

  let n = 0
  for (const [name, meta] of byName) {
    const id = slugify(name)
    await db.collection('departments').doc(id).set(
      {
        id,
        name,
        categories: meta.categories,
        serviceCodes: meta.serviceCodes,
        slaHoursBySeverity: meta.slaHoursBySeverity,
        contactEmail: DEPARTMENTS[meta.categories[0] as keyof typeof DEPARTMENTS]?.contactEmail || `${id}@bbmp.gov.in`,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    )
    n++
    console.log('Seeded department:', id, name)
  }
  console.log('Done — seeded', n, 'departments')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
