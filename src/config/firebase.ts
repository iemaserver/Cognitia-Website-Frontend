/// <reference types="vite/client" />

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Backend Firebase Account (Your Account - for Firestore Database & Storage)
const firebaseBackendConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_GCS_BUCKET_NAME || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Backend Firebase App instance
const existingApps = getApps();
export const app = existingApps.find(a => a.name === '[DEFAULT]') || initializeApp(firebaseBackendConfig);

// Export Firestore Database & Auth instances (connected to your backend project)
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export Storage instance (connected to your backend GCS/Firebase storage bucket)
const bucket = firebaseBackendConfig.storageBucket;
export const storage = bucket
  ? getStorage(app, bucket.startsWith('gs://') ? bucket : `gs://${bucket}`)
  : getStorage(app);

// Enable offline persistence for Firestore database
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firestore] Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore] Persistence not supported by current browser');
    }
  });
}
