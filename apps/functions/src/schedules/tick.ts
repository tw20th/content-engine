// apps/functions/src/schedules/tick.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { getAdminDb } from '../lib/firebaseAdmin';
import { listDueJobs, scheduledJobsCol } from '../lib/jobStore';
import { runJobOnce } from '../lib/runners/runJob';

const REGION = 'asia-northeast1';
const TIME_ZONE = 'Asia/Tokyo';

export const tick = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: TIME_ZONE,
    region: REGION,
  },
  async () => {
    const db = getAdminDb();
    const now = new Date();

    const due = await listDueJobs(
      db,
      /* now */ (await import('firebase-admin/firestore')).Timestamp.fromDate(now),
    );

    if (due.length === 0) {
      logger.info('[tick] no due jobs');
      return;
    }

    logger.info(`[tick] due jobs: ${due.length}`);

    for (const { id: jobId, data: job } of due) {
      const result = await runJobOnce(db, jobId, job);

      // jobの nextRunAt / lastRunAt を更新
      await scheduledJobsCol(db)
        .doc(jobId)
        .update({
          lastRunAt: (await import('firebase-admin/firestore')).Timestamp.fromDate(new Date()),
          nextRunAt: result.nextRunAt,
        });

      logger.info(
        `[tick] ran job=${jobId} runId=${result.runId} blogs=${result.createdBlogIds.length}`,
      );
    }
  },
);
