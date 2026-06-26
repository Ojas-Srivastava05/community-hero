/**
 * Grant or revoke Firebase Auth custom claim { admin: true }.
 *
 * Usage:
 *   npx tsx scripts/set-admin-claim.ts <uid>           # grant admin
 *   npx tsx scripts/set-admin-claim.ts <uid> --revoke  # revoke admin
 *
 * See docs/FIREBASE-ADMIN-CLAIMS.md for setup and Firestore rules integration.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const projectId = process.env.FIREBASE_PROJECT_ID || 'community-hero-vibe2ship'
initializeApp({ credential: applicationDefault(), projectId })

async function main() {
  const uid = process.argv[2]
  const revoke = process.argv.includes('--revoke')
  if (!uid) {
    console.error('Usage: npx tsx scripts/set-admin-claim.ts <uid> [--revoke]')
    process.exit(1)
  }

  const auth = getAuth()
  const user = await auth.getUser(uid)
  const claims = { ...(user.customClaims ?? {}), admin: !revoke }
  if (revoke) delete (claims as { admin?: boolean }).admin

  await auth.setCustomUserClaims(uid, claims)
  console.log(revoke ? 'Revoked admin claim for' : 'Granted admin claim to', uid, `(${user.email || 'no email'})`)
  console.log('User must sign out and sign back in for the new token to take effect.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
