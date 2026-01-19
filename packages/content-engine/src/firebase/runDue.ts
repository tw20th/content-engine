//packages/content-engine/src/firebase/runDue.ts
import { onRequest } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ScheduledJobDoc = {
  nextRunAt?: number;
  strategyId?: string;
  payload?: unknown;
};

const getAdminDb = () => {
  if (getApps().length === 0) initializeApp();
  return getFirestore();
};

export const runDue = onRequest({ region: 'asia-northeast1' }, async (_req, res) => {
  const now = Date.now();

  try {
    const db = getAdminDb();

    const snap = await db.collection('scheduledJobs').where('nextRunAt', '<=', now).limit(20).get();

    if (snap.empty) {
      res.status(200).json({ ok: true, processed: 0, now });
      return;
    }

    const batch = db.batch();

    snap.docs.forEach((doc) => {
      const job = doc.data() as ScheduledJobDoc;
      const runRef = db.collection('runs').doc();

      batch.set(runRef, {
        jobId: doc.id,
        createdAt: now,
        status: 'queued',
        strategyId: job.strategyId ?? '',
        payload: job.payload ?? {},
      });

      batch.update(doc.ref, {
        nextRunAt: now + 5 * 60 * 1000,
        updatedAt: now,
      });
    });

    await batch.commit();
    res.status(200).json({ ok: true, processed: snap.size, now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ ok: false, error: msg, now });
  }
});
