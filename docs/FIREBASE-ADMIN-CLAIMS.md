# Firebase Admin Custom Claims

Community Hero uses Firebase Auth **custom claims** for admin privileges instead of hardcoded email allowlists in Firestore rules.

## Claim shape

```json
{ "admin": true }
```

Admins may update any issue (status changes, proof uploads) and perform privileged Firestore writes when rules check `isAdmin()`.

## Grant admin to a user

Prerequisites: Application Default Credentials (`gcloud auth application-default login`) and `FIREBASE_PROJECT_ID` if not using the default project.

```bash
cd server
npx tsx scripts/set-admin-claim.ts <firebase-uid>
```

Revoke:

```bash
npx tsx scripts/set-admin-claim.ts <firebase-uid> --revoke
```

Find a user's UID in the Firebase Console → Authentication, or from their ID token (`sub` claim).

## Token refresh

Custom claims are embedded in the ID token at sign-in. After granting or revoking, the user must **sign out and sign back in** (or force-refresh the token) before Firestore rules see the change.

## Firestore rules

`firestore.rules` defines:

```javascript
function isAdmin() {
  return signedIn() && request.auth.token.admin == true;
}
```

Issue updates are allowed for the reporter **or** an admin. Server-side admin routes (`PATCH /api/reports/:id/status`) still also honor `ADMIN_UIDS` / `ADMIN_EMAILS` env vars for Cloud Run operators who have not yet received custom claims.

## Production checklist

1. Grant `admin: true` to municipal operator UIDs via `set-admin-claim.ts`.
2. Deploy rules: `firebase deploy --only firestore:rules`.
3. Remove reliance on personal emails in rules (legacy email checks are no longer in rules).
4. Document operator UIDs in your internal runbook (not in git).
