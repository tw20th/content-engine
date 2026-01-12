"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  runDue: () => runDue,
  tick: () => tick
});
module.exports = __toCommonJS(index_exports);
var import_content_engine3 = require("@tw20th/content-engine");

// src/lib/registerStrategies.ts
var import_content_engine = require("@tw20th/content-engine");
var import_strategy_quiet_spread = require("@tw20th/strategy-quiet-spread");
var import_strategy_quiet_rewrite = require("@tw20th/strategy-quiet-rewrite");
var import_strategy_rewrite_basic = require("@tw20th/strategy-rewrite-basic");
var import_strategy_seo_basic = require("@tw20th/strategy-seo-basic");
var import_strategy_openai_basic = require("@tw20th/strategy-openai-basic");
var registered = false;
var registerStrategies = () => {
  if (registered) return;
  registered = true;
  (0, import_content_engine.registerStrategy)(import_strategy_quiet_spread.quietSpreadStrategy);
  (0, import_content_engine.registerStrategy)(import_strategy_quiet_rewrite.quietRewriteStrategy);
  (0, import_content_engine.registerStrategy)(import_strategy_rewrite_basic.rewriteBasicStrategy);
  (0, import_content_engine.registerStrategy)(import_strategy_seo_basic.seoBasicStrategy);
  (0, import_content_engine.registerStrategy)(import_strategy_openai_basic.openaiBasicStrategy);
};

// src/schedules/tick.ts
var import_scheduler = require("firebase-functions/v2/scheduler");
var import_firebase_functions = require("firebase-functions");
var import_params = require("firebase-functions/params");
var import_firestore4 = require("firebase-admin/firestore");

// src/lib/firebaseAdmin.ts
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var getAdminDb = () => {
  if ((0, import_app.getApps)().length === 0) {
    (0, import_app.initializeApp)();
  }
  return (0, import_firestore.getFirestore)();
};

// src/lib/jobStore.ts
var import_firestore2 = require("firebase-admin/firestore");
var scheduledJobsCol = (db) => db.collection("scheduledJobs");
var runsCol = (db) => db.collection("runs");
var blogsCol = (db) => db.collection("blogs");
var toTs = (d) => import_firestore2.Timestamp.fromDate(d);
var listDueJobs = async (db, now) => {
  const snap = await scheduledJobsCol(db).where("enabled", "==", true).where("nextRunAt", "<=", now).limit(50).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data()
  }));
};

// src/lib/runners/runJob.ts
var import_firestore3 = require("firebase-admin/firestore");
var import_crypto = require("crypto");
var import_content_engine2 = require("@tw20th/content-engine");

// src/lib/cron.ts
var import_cron_parser = __toESM(require("cron-parser"));
var getNextRunDate = (cron, baseDate) => {
  const interval = import_cron_parser.default.parseExpression(cron, {
    currentDate: baseDate
  });
  return interval.next().toDate();
};

// src/lib/runners/runJob.ts
var buildEngineInput = (job) => {
  return {
    presetId: job.engine.presetId,
    strategyId: job.engine.strategyId,
    sourceId: job.engine.sourceId,
    channelId: job.engine.channelId,
    topic: job.input?.topic,
    draft: job.input?.draft
  };
};
var getStrategyMetrics = (article) => {
  const a = article;
  return a.meta?.strategyMetrics;
};
var saveBlog = async (db, jobId, runId, article) => {
  const docRef = blogsCol(db).doc();
  await docRef.set({
    ...article,
    strategyId: article.ids.strategyId ?? "unknown",
    sourceId: article.ids.sourceId ?? "unknown",
    channelId: article.ids.channelId ?? "unknown",
    jobId,
    runId,
    createdAt: article.createdAt
  });
  return docRef.id;
};
var runJobOnce = async (db, jobId, job) => {
  const runId = (0, import_crypto.randomUUID)();
  const startedAt = import_firestore3.Timestamp.now();
  try {
    const engineInput = buildEngineInput(job);
    const { config, article } = await (0, import_content_engine2.runResolvedContentEngine)(engineInput);
    const blogId = await saveBlog(db, jobId, runId, article);
    const endedAt = import_firestore3.Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, /* @__PURE__ */ new Date());
    const runLog = {
      jobId,
      runId,
      presetId: config.presetId ?? "unknown",
      strategyId: config.strategyId ?? "unknown",
      sourceId: config.sourceId ?? "unknown",
      channelId: config.channelId ?? "unknown",
      startedAt,
      endedAt,
      status: "success",
      createdBlogIds: [blogId],
      metrics: getStrategyMetrics(article),
      warnings: config.warnings
    };
    await runsCol(db).doc(runId).set(runLog);
    return {
      runId,
      createdBlogIds: [blogId],
      nextRunAt: toTs(nextRunDate)
    };
  } catch (e) {
    const endedAt = import_firestore3.Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, /* @__PURE__ */ new Date());
    const err = e instanceof Error ? e : new Error("Unknown error");
    const runLog = {
      jobId,
      runId,
      presetId: job.engine.presetId,
      strategyId: job.engine.strategyId ?? "unknown",
      sourceId: job.engine.sourceId ?? "unknown",
      channelId: job.engine.channelId ?? "unknown",
      startedAt,
      endedAt,
      status: "error",
      createdBlogIds: [],
      error: {
        message: err.message,
        stack: err.stack
      }
    };
    await runsCol(db).doc(runId).set(runLog);
    return {
      runId,
      createdBlogIds: [],
      nextRunAt: toTs(nextRunDate)
    };
  }
};

// src/schedules/tick.ts
var REGION = "asia-northeast1";
var TIME_ZONE = "Asia/Tokyo";
var OPENAI_API_KEY = (0, import_params.defineSecret)("OPENAI_API_KEY");
var tick = (0, import_scheduler.onSchedule)(
  {
    schedule: "every 5 minutes",
    timeZone: TIME_ZONE,
    region: REGION,
    // ✅ これがないと Secret は関数に渡らない
    secrets: [OPENAI_API_KEY]
  },
  async () => {
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    const db = getAdminDb();
    const now = /* @__PURE__ */ new Date();
    const due = await listDueJobs(db, import_firestore4.Timestamp.fromDate(now));
    if (due.length === 0) {
      import_firebase_functions.logger.info("[tick] no due jobs");
      return;
    }
    import_firebase_functions.logger.info(`[tick] due jobs: ${due.length}`);
    for (const { id: jobId, data: job } of due) {
      const result = await runJobOnce(db, jobId, job);
      await scheduledJobsCol(db).doc(jobId).update({
        lastRunAt: import_firestore4.Timestamp.fromDate(/* @__PURE__ */ new Date()),
        nextRunAt: result.nextRunAt
      });
      import_firebase_functions.logger.info(
        `[tick] ran job=${jobId} runId=${result.runId} blogs=${result.createdBlogIds.length}`
      );
    }
  }
);

// src/http/runDue.ts
var import_https = require("firebase-functions/v2/https");
var import_firebase_functions2 = require("firebase-functions");
var import_params2 = require("firebase-functions/params");
var import_firestore5 = require("firebase-admin/firestore");
var REGION2 = "asia-northeast1";
var OPENAI_API_KEY2 = (0, import_params2.defineSecret)("OPENAI_API_KEY");
var runDue = (0, import_https.onRequest)(
  { region: REGION2, secrets: [OPENAI_API_KEY2], invoker: "public" },
  async (_req, res) => {
    try {
      process.env.OPENAI_API_KEY ||= OPENAI_API_KEY2.value();
      const db = getAdminDb();
      const now = import_firestore5.Timestamp.now();
      const due = await listDueJobs(db, now);
      for (const { id: jobId, data: job } of due) {
        const result = await runJobOnce(db, jobId, job);
        await scheduledJobsCol(db).doc(jobId).update({
          lastRunAt: import_firestore5.Timestamp.now(),
          nextRunAt: result.nextRunAt
        });
      }
      res.json({ ok: true, due: due.length });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      import_firebase_functions2.logger.error("[runDue] fatal", { message: err.message, stack: err.stack });
      res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }
);

// src/index.ts
(0, import_content_engine3.bootstrapContentEngine)();
registerStrategies();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runDue,
  tick
});
//# sourceMappingURL=index.js.map
