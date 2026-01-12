"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDb = void 0;
// apps/functions/src/lib/firebaseAdmin.ts
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const getAdminDb = () => {
    if ((0, app_1.getApps)().length === 0) {
        (0, app_1.initializeApp)();
    }
    return (0, firestore_1.getFirestore)();
};
exports.getAdminDb = getAdminDb;
