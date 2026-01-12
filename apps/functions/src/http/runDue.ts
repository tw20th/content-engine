import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../lib/firebaseAdmin';
import { listDueJobs, scheduledJobsCol } from '../lib/jobStore';
import { runJobOnce } from '../lib/runners/runJob';

const REGION = 'asia-northeast1';

export const runDue = onRequest({ region: REGION }, async (_req, res) => {
  const db = getAdminDb();
  const now = Timestamp.now();

  const due = await listDueJobs(db, now);

  for (const { id: jobId, data: job } of due) {
    const result = await runJobOnce(db, jobId, job);
    await scheduledJobsCol(db).doc(jobId).update({
      lastRunAt: Timestamp.now(),
      nextRunAt: result.nextRunAt,
    });
  }

  res.json({ ok: true, due: due.length });
});
