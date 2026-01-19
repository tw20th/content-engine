//apps/functions/src/lib/engineConfig.ts
import type { Firestore } from 'firebase-admin/firestore';

export type EngineConfigDoc = {
  activePresetId?: string;
  updatedAt?: unknown;
};

export const engineConfigDocRef = (db: Firestore) =>
  db.collection('contentEngineConfig').doc('current');

export const getActivePresetId = async (db: Firestore): Promise<string | null> => {
  const snap = await engineConfigDocRef(db).get();
  const data = snap.exists ? (snap.data() as EngineConfigDoc) : undefined;

  const v = data?.activePresetId;
  return v && v.trim() ? v.trim() : null;
};
