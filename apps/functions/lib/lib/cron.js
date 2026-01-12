"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextRunDate = void 0;
// apps/functions/src/lib/cron.ts
const cron_parser_1 = __importDefault(require("cron-parser"));
const getNextRunDate = (cron, baseDate) => {
    const interval = cron_parser_1.default.parseExpression(cron, {
        currentDate: baseDate,
    });
    return interval.next().toDate();
};
exports.getNextRunDate = getNextRunDate;
