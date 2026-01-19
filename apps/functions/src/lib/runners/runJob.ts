import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

import {
  runResolvedContentEngine,
  type RunResolvedInputUnresolved,
  type GeneratedArticle,
} from '@tw20th/content-engine';

import type { ScheduledJob, RunLog } from '../jobStore';
import { blogsCol, runsCol, toTs } from '../jobStore';
import { getNextRunDate } from '../cron';
import { getActivePresetId } from '../engineConfig';

export type RunJobResult = {
  runId: string;
  createdBlogIds: string[];
  nextRunAt: Timestamp;
};

const ensureTimeZone = (tz: string | undefined): string => (tz && tz.trim() ? tz : 'Asia/Tokyo');

const buildEngineInput = (job: ScheduledJob): RunResolvedInputUnresolved => {
  return {
    presetId: job.engine.presetId,
    strategyId: job.engine.strategyId,
    sourceId: job.engine.sourceId,
    channelId: job.engine.channelId,
    topic: job.input?.topic,
    draft: job.input?.draft,
  };
};

/**
 * GeneratedArticle に meta が無い問題を安全に回避
 */
const getStrategyMetrics = (article: GeneratedArticle): Record<string, unknown> | undefined => {
  const a = article as GeneratedArticle & {
    meta?: { strategyMetrics?: Record<string, unknown> };
  };
  return a.meta?.strategyMetrics;
};

const saveBlog = async (db: Firestore, jobId: string, runId: string, article: GeneratedArticle) => {
  const docRef = blogsCol(db).doc();
  await docRef.set({
    ...article,
    strategyId: article.ids.strategyId ?? 'unknown',
    sourceId: article.ids.sourceId ?? 'unknown',
    channelId: article.ids.channelId ?? 'unknown',
    jobId,
    runId,
    createdAt: article.createdAt,
  });
  return docRef.id;
};

export const runJobOnce = async (
  db: Firestore,
  jobId: string,
  job: ScheduledJob,
): Promise<RunJobResult> => {
  const runId = randomUUID();
  const startedAt = Timestamp.now();

  try {
    // ✅ presetId 優先順位：job固有 > 全体運用(activePresetId) > engine側fallback
    const engineInput = buildEngineInput(job);

    if (!engineInput.presetId) {
      const activePresetId = await getActivePresetId(db);
      if (activePresetId) engineInput.presetId = activePresetId;
    }

    const { config, article } = await runResolvedContentEngine(engineInput);

    const blogId = await saveBlog(db, jobId, runId, article);

    const endedAt = Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, new Date());

    const runLog: RunLog = {
      jobId,
      runId,
      presetId: config.presetId ?? 'unknown',
      strategyId: config.strategyId ?? 'unknown',
      sourceId: config.sourceId ?? 'unknown',
      channelId: config.channelId ?? 'unknown',
      startedAt,
      endedAt,
      status: 'success',
      createdBlogIds: [blogId],
      metrics: getStrategyMetrics(article),
      warnings: config.warnings,
    };

    await runsCol(db).doc(runId).set(runLog);

    return {
      runId,
      createdBlogIds: [blogId],
      nextRunAt: toTs(nextRunDate),
    };
  } catch (e) {
    const endedAt = Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, new Date());
    const err = e instanceof Error ? e : new Error('Unknown error');

    const runLog: RunLog = {
      jobId,
      runId,
      presetId: job.engine.presetId,
      strategyId: job.engine.strategyId ?? 'unknown',
      sourceId: job.engine.sourceId ?? 'unknown',
      channelId: job.engine.channelId ?? 'unknown',
      startedAt,
      endedAt,
      status: 'error',
      createdBlogIds: [],
      error: {
        message: err.message,
        stack: err.stack,
      },
    };

    await runsCol(db).doc(runId).set(runLog);

    return {
      runId,
      createdBlogIds: [],
      nextRunAt: toTs(nextRunDate),
    };
  }
};
