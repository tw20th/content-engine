// packages/content-engine/src/cli/firebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const must = (v: string | undefined, name: string): string => {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

export const getAdminDb = () => {
  const projectId = must(process.env.FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID');
  const clientEmail = must(process.env.FIREBASE_CLIENT_EMAIL, 'FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = must(process.env.FIREBASE_PRIVATE_KEY, 'FIREBASE_PRIVATE_KEY');

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getFirestore();
};
