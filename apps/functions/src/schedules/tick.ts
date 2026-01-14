// apps/functions/src/schedules/tick.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../lib/firebaseAdmin';
import { listDueJobs, scheduledJobsCol } from '../lib/jobStore';
import { runJobOnce } from '../lib/runners/runJob';
import { initEngineOnce } from '../lib/initEngine';

const REGION = 'asia-northeast1';
const TIME_ZONE = 'Asia/Tokyo';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const NODE_AUTH_TOKEN = defineSecret('NODE_AUTH_TOKEN'); // ✅ 追加

export const tick = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: TIME_ZONE,
    region: REGION,
    // ✅ Secret は関数に渡す（両方渡す）
    secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN], // ✅ 追加
  },
  async () => {
    // ✅ content-engine が process.env を見る前提を満たす
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();

    // （任意）関数内で必要になるケースに備えて
    process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value(); // ✅ 追加（害はない）

    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    initEngineOnce();

    const db = getAdminDb();
    const now = new Date();

    const due = await listDueJobs(db, Timestamp.fromDate(now));

    if (due.length === 0) {
      logger.info('[tick] no due jobs');
      return;
    }

    logger.info(`[tick] due jobs: ${due.length}`);

    for (const { id: jobId, data: job } of due) {
      const result = await runJobOnce(db, jobId, job);

      await scheduledJobsCol(db)
        .doc(jobId)
        .update({
          lastRunAt: Timestamp.fromDate(new Date()),
          nextRunAt: result.nextRunAt,
        });

      logger.info(
        `[tick] ran job=${jobId} runId=${result.runId} blogs=${result.createdBlogIds.length}`,
      );
    }
  },
);
