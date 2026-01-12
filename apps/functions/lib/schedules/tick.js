"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tick = void 0;
// apps/functions/src/schedules/tick.ts
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const jobStore_1 = require("../lib/jobStore");
const runJob_1 = require("../lib/runners/runJob");
const REGION = 'asia-northeast1';
const TIME_ZONE = 'Asia/Tokyo';
exports.tick = (0, scheduler_1.onSchedule)({
    schedule: 'every 5 minutes',
    timeZone: TIME_ZONE,
    region: REGION,
}, async () => {
    const db = (0, firebaseAdmin_1.getAdminDb)();
    const now = new Date();
    const due = await (0, jobStore_1.listDueJobs)(db, 
    /* now */ (await Promise.resolve().then(() => __importStar(require('firebase-admin/firestore')))).Timestamp.fromDate(now));
    if (due.length === 0) {
        firebase_functions_1.logger.info('[tick] no due jobs');
        return;
    }
    firebase_functions_1.logger.info(`[tick] due jobs: ${due.length}`);
    for (const { id: jobId, data: job } of due) {
        const result = await (0, runJob_1.runJobOnce)(db, jobId, job);
        // jobの nextRunAt / lastRunAt を更新
        await (0, jobStore_1.scheduledJobsCol)(db)
            .doc(jobId)
            .update({
            lastRunAt: (await Promise.resolve().then(() => __importStar(require('firebase-admin/firestore')))).Timestamp.fromDate(new Date()),
            nextRunAt: result.nextRunAt,
        });
        firebase_functions_1.logger.info(`[tick] ran job=${jobId} runId=${result.runId} blogs=${result.createdBlogIds.length}`);
    }
});
