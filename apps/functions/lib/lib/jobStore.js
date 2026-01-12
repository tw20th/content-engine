"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEnabledJobsWithoutNext = exports.listDueJobs = exports.toTs = exports.nowTs = exports.blogsCol = exports.runsCol = exports.scheduledJobsCol = void 0;
const firestore_1 = require("firebase-admin/firestore");
const scheduledJobsCol = (db) => db.collection('scheduledJobs');
exports.scheduledJobsCol = scheduledJobsCol;
const runsCol = (db) => db.collection('runs');
exports.runsCol = runsCol;
const blogsCol = (db) => db.collection('blogs');
exports.blogsCol = blogsCol;
const nowTs = () => firestore_1.Timestamp.fromDate(new Date());
exports.nowTs = nowTs;
const toTs = (d) => firestore_1.Timestamp.fromDate(d);
exports.toTs = toTs;
const listDueJobs = async (db, now) => {
    const snap = await (0, exports.scheduledJobsCol)(db)
        .where('enabled', '==', true)
        .where('nextRunAt', '<=', now)
        .limit(50)
        .get();
    return snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
    }));
};
exports.listDueJobs = listDueJobs;
const listEnabledJobsWithoutNext = async (db) => {
    const snap = await (0, exports.scheduledJobsCol)(db)
        .where('enabled', '==', true)
        .where('nextRunAt', '==', null)
        .limit(200)
        .get();
    return snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
    }));
};
exports.listEnabledJobsWithoutNext = listEnabledJobsWithoutNext;
