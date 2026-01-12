"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDue = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const jobStore_1 = require("../lib/jobStore");
const runJob_1 = require("../lib/runners/runJob");
const REGION = 'asia-northeast1';
exports.runDue = (0, https_1.onRequest)({ region: REGION }, async (_req, res) => {
    const db = (0, firebaseAdmin_1.getAdminDb)();
    const now = firestore_1.Timestamp.now();
    const due = await (0, jobStore_1.listDueJobs)(db, now);
    for (const { id: jobId, data: job } of due) {
        const result = await (0, runJob_1.runJobOnce)(db, jobId, job);
        await (0, jobStore_1.scheduledJobsCol)(db).doc(jobId).update({
            lastRunAt: firestore_1.Timestamp.now(),
            nextRunAt: result.nextRunAt,
        });
    }
    res.json({ ok: true, due: due.length });
});
