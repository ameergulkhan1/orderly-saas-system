// src/lib/firebaseAdmin.ts
//
// Lazily initializes Firebase Admin on first use.
//
// Why lazy? If Firebase env vars are missing (e.g., local dev before setup,
// or a deploy where someone forgot to set them), the whole server would
// otherwise crash on import. Lazy init means only Google-authenticated
// requests fail — the rest of the API stays up.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { HttpError } from './httpError';

let app: App | null = null;
let auth: Auth | null = null;

/**
 * Get (or initialize once) the Firebase Admin Auth instance.
 * Throws HttpError 500 with code FIREBASE_NOT_CONFIGURED if env vars are missing.
 */
function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new HttpError(
      500,
      'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      'FIREBASE_NOT_CONFIGURED'
    );
  }

  if (!getApps().length) {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  return auth;
}

/**
 * Public API — preserves the original shape so existing callers
 * (auth.service.ts) keep working without any changes.
 */
export const firebaseAuth = {
  verifyIdToken: (idToken: string, checkRevoked?: boolean) =>
    getFirebaseAuth().verifyIdToken(idToken, checkRevoked),
};