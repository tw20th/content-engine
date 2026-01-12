"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJobOnce = void 0;
const firestore_1 = require("firebase-admin/firestore");
const crypto_1 = require("crypto");
const content_engine_1 = require("@tw20th/content-engine");
const jobStore_1 = require("../jobStore");
const cron_1 = require("../cron");
const ensureTimeZone = (tz) => (tz && tz.trim() ? tz : 'Asia/Tokyo');
const buildEngineInput = (job) => {
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
const getStrategyMetrics = (article) => {
    const a = article;
    return a.meta?.strategyMetrics;
};
const saveBlog = async (db, jobId, runId, article) => {
    const docRef = (0, jobStore_1.blogsCol)(db).doc();
    await docRef.set({
        ...article,
        strategyId: article.ids.strategyId,
        sourceId: article.ids.sourceId,
        channelId: article.ids.channelId,
        jobId,
        runId,
        createdAt: article.createdAt,
    });
    return docRef.id;
};
const runJobOnce = async (db, jobId, job) => {
    const runId = (0, crypto_1.randomUUID)();
    const startedAt = firestore_1.Timestamp.now();
    try {
        const engineInput = buildEngineInput(job);
        const { config, article } = await (0, content_engine_1.runResolvedContentEngine)(engineInput);
        const blogId = await saveBlog(db, jobId, runId, article);
        const endedAt = firestore_1.Timestamp.now();
        const nextRunDate = (0, cron_1.getNextRunDate)(job.cron, new Date());
        const runLog = {
            jobId,
            runId,
            presetId: config.presetId,
            strategyId: config.strategyId,
            sourceId: config.sourceId,
            channelId: config.channelId,
            startedAt,
            endedAt,
            status: 'success',
            createdBlogIds: [blogId],
            metrics: getStrategyMetrics(article),
            warnings: config.warnings,
        };
        await (0, jobStore_1.runsCol)(db).doc(runId).set(runLog);
        return {
            runId,
            createdBlogIds: [blogId],
            nextRunAt: (0, jobStore_1.toTs)(nextRunDate),
        };
    }
    catch (e) {
        const endedAt = firestore_1.Timestamp.now();
        const nextRunDate = (0, cron_1.getNextRunDate)(job.cron, new Date());
        const err = e instanceof Error ? e : new Error('Unknown error');
        const runLog = {
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
        await (0, jobStore_1.runsCol)(db).doc(runId).set(runLog);
        return {
            runId,
            createdBlogIds: [],
            nextRunAt: (0, jobStore_1.toTs)(nextRunDate),
        };
    }
};
exports.runJobOnce = runJobOnce;
