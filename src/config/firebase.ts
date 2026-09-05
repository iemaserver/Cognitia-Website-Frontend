/// <reference types="vite/client" />

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Backend Firebase Account (for Firestore Database & Storage)
const firebaseBackendConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCQviQ7oNGS1_R5oy06m9uhqJv2C4MLOjc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cognitia-2k26.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cognitia-2k26',
  storageBucket: import.meta.env.VITE_GCS_BUCKET_NAME || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cognitia-2k26.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '985000292048',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:985000292048:web:3947fe9298c089a5ec78d5',
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
