// apps/functions/src/lib/jobStore.ts
import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export type ScheduledJob = {
  enabled: boolean;
  cron: string;
  timeZone: string;
  engine: {
    presetId?: string;
    strategyId?: string;
    sourceId?: string;
    channelId?: string;
  };
  input?: {
    topic?: string;
    draft?: string;
  };
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  siteId?: string;
};

export type RunLog = {
  jobId: string;
  runId: string;

  presetId?: string;
  strategyId: string;
  sourceId: string;
  channelId: string;

  startedAt: Timestamp;
  endedAt: Timestamp;
  status: 'success' | 'error';

  createdBlogIds: string[];
  metrics?: Record<string, unknown>;

  warnings?: string[];

  error?: {
    message: string;
    stack?: string;
  };
};

export const scheduledJobsCol = (db: Firestore) => db.collection('scheduledJobs');
export const runsCol = (db: Firestore) => db.collection('runs');
export const blogsCol = (db: Firestore) => db.collection('blogs');

export const nowTs = (): Timestamp => Timestamp.fromDate(new Date());

export const toTs = (d: Date): Timestamp => Timestamp.fromDate(d);

export const listDueJobs = async (db: Firestore, now: Timestamp) => {
  const snap = await scheduledJobsCol(db)
    .where('enabled', '==', true)
    .where('nextRunAt', '<=', now)
    .limit(50)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as ScheduledJob,
  }));
};

export const listEnabledJobsWithoutNext = async (db: Firestore) => {
  const snap = await scheduledJobsCol(db)
    .where('enabled', '==', true)
    .where('nextRunAt', '==', null)
    .limit(200)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as ScheduledJob,
  }));
};
