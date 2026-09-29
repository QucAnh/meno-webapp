import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import configJson from "../firebase-applet-config.json";

// Support both environment variables (e.g., on Vercel deployment) and local config
const env: Record<string, string | undefined> =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env) || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || configJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || configJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || configJson.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || configJson.measurementId || undefined,
};

export const projectId = firebaseConfig.projectId;

// Initialize Firebase App singleton
export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided (for custom named databases)
export const firestoreDatabaseId =
  configJson.firestoreDatabaseId || "(default)";
export const db =
  configJson.firestoreDatabaseId &&
  configJson.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, configJson.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Authentication and Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

