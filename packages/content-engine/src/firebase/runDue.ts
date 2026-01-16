// packages/content-engine/src/firebase/runDue.ts
import { onRequest } from 'firebase-functions/v2/https';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { getAdminDb } from '../cli/firebaseAdmin.js'; // ※場所は実ファイルに合わせて

export const runDue = onRequest({ region: 'asia-northeast1' }, async (_req, res) => {
  try {
    const db = getAdminDb();
    const now = Date.now();

    const snap = await db.collection('scheduledJobs').where('nextRunAt', '<=', now).limit(20).get();

    if (snap.empty) {
      res.status(200).json({ ok: true, processed: 0, now });
      return;
    }

    const batch = db.batch();

    snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const runRef = db.collection('runs').doc();
      batch.set(runRef, { jobId: doc.id, createdAt: now, status: 'queued' });
      batch.update(doc.ref, { nextRunAt: now + 5 * 60 * 1000, updatedAt: now });
    });

    await batch.commit();
    res.status(200).json({ ok: true, processed: snap.size, now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ ok: false, error: msg });
  }
});
