// lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton — Next.js hot reload can call initializeApp twice
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface GoogleUserResult {
  idToken: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  uid: string;
}

/**
 * Open the Google sign-in popup and return the ID token + basic profile.
 * The caller sends the idToken to your backend to exchange for your own JWT.
 */
export async function signInWithGoogle(): Promise<GoogleUserResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    email: result.user.email,
    name: result.user.displayName,
    photoURL: result.user.photoURL,
    uid: result.user.uid,
  };
}

/**
 * Send a password reset email via Firebase Auth.
 * Firebase handles the whole reset flow on its hosted page.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email, {
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
  });
}