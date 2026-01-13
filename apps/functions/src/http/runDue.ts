// apps/functions/src/http/runDue.ts
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../lib/firebaseAdmin';
import { listDueJobs, scheduledJobsCol } from '../lib/jobStore';
import { runJobOnce } from '../lib/runners/runJob';

const REGION = 'asia-northeast1';
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const NODE_AUTH_TOKEN = defineSecret('NODE_AUTH_TOKEN'); // ✅ 追加

export const runDue = onRequest(
  { region: REGION, secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN], invoker: 'public' }, // ✅ 追加
  async (_req, res) => {
    try {
      // ✅ content-engine が process.env を見る前提を満たす
      process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();

      // （任意）関数内で必要になるケースに備えて
      process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value(); // ✅ 追加

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
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error');
      logger.error('[runDue] fatal', { message: err.message, stack: err.stack });
      res.status(500).json({ ok: false, error: { message: err.message } });
    }
  },
);
