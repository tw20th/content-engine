//packages/content-engine/src/cli/firebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

const hasCertEnv = () =>
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

export const getAdminDb = (): Firestore => {
  if (getApps().length === 0) {
    if (hasCertEnv()) {
      const projectId = process.env.FIREBASE_PROJECT_ID!;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      initializeApp();
    }
  }

  return getFirestore();
};
