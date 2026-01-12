// apps/functions/src/lib/firebaseAdmin.ts
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const getAdminDb = () => {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore();
};
